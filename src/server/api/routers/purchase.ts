/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// Module: purchaseRouter (verifyAndCredit mutation)
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { VerifierClient } from "@creofam/verifier"
import { Prisma, type PaymentProvider } from "@prisma/client"

const PACKAGES = {
    1: { price: 50, tokens: 50 },
    2: { price: 200, tokens: 200 },
    3: { price: 500, tokens: 500 },
} as const

const normalizeName = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ")

const client = new VerifierClient({
    apiKey: process.env.VERIFIER_API_KEY,
    timeoutMs: 20000,
})

export const purchaseRouter = createTRPCRouter({
    verifyAndCredit: protectedProcedure
        .input(
            z.object({
                provider: z.enum(["telebirr", "cbe", "abyssinia"]),
                reference: z.string().min(5),
                packageId: z.number().int().positive(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const pkg = PACKAGES[input.packageId as 1 | 2 | 3]
            if (!pkg) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid package" })
            }

            // Duplicate guard
            const providerEnum = input.provider as PaymentProvider
            const existing = await ctx.db.receipt.findUnique({
                where: { provider_reference: { provider: providerEnum, reference: input.reference } },
            })
            if (existing) {
                throw new TRPCError({ code: "CONFLICT", message: "This reference number has already been used." })
            }

            let amount: number
            let receiverName: string
            let payerName: string
            let status: string | undefined
            let receiptData: Prisma.InputJsonObject

            if (input.provider === "telebirr") {
                const result = await client.verifyTelebirr({ reference: input.reference })
                if (!result.ok) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: result.error ?? "Verification failed" })
                }
                amount = result.data.amount
                receiverName = result.data.receiverName ?? ""
                payerName = result.data.payerName ?? ""
                status = result.data.status ?? result.data.statusText
                receiptData = {
                    reference: result.data.reference,
                    amount: result.data.amount,
                    currency: result.data.currency,
                    payerName: result.data.payerName,
                    payerPhone: result.data.payerPhone,
                    receiverName: result.data.receiverName,
                    receiverAccount: result.data.receiverAccount,
                    txnDate: result.data.txnDate,
                    totalAmount: result.data.totalAmount,
                    serviceFee: result.data.serviceFee,
                    serviceFeeVAT: result.data.serviceFeeVAT,
                    statusText: result.data.statusText,
                    status: result.data.status,
                }
            } else if (input.provider === "cbe") {
                const result = await client.verifyCBE({
                    reference: input.reference,
                    accountSuffix: process.env.CBE_ACCOUNT_SUFFIX ?? "",
                })
                if (!result.ok) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: result.error ?? "Verification failed" })
                }
                amount = result.data.amount
                receiverName = result.data.receiverName ?? ""
                payerName = result.data.payerName ?? ""
                status = undefined
                receiptData = {
                    reference: result.data.reference,
                    amount: result.data.amount,
                    currency: result.data.currency,
                    payerName: result.data.payerName,
                    payerAccount: result.data.payerAccount,
                    receiverName: result.data.receiverName,
                    receiverAccount: result.data.receiverAccount,
                    txnDate: result.data.txnDate,
                    reason: result.data.reason,
                }
            } else {
                const result = await client.verifyAbyssinia({
                    reference: input.reference,
                    suffix: process.env.ABYSSINIA_ACCOUNT_SUFFIX ?? "",
                })
                if (!result.ok) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: result.error ?? "Verification failed" })
                }
                amount = result.data.amount
                receiverName = result.data.receiverName ?? ""
                payerName = result.data.payerName ?? ""
                status = undefined
                receiptData = {
                    reference: result.data.reference,
                    amount: result.data.amount,
                    currency: result.data.currency,
                    payerName: result.data.payerName,
                    payerAccount: result.data.payerAccount,
                    receiverName: result.data.receiverName,
                    txnDate: result.data.txnDate,
                    reason: result.data.reason,
                }
            }

            if (amount !== pkg.price) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Amount mismatch: expected ${pkg.price} ETB, got ${amount} ETB`,
                })
            }

            if (normalizeName(receiverName) !== normalizeName(process.env.PLATFORM_OWNER_FULLNAME ?? "")) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Payment received by unexpected account",
                })
            }

            try {
                const [, updated] = await ctx.db.$transaction([
                    ctx.db.receipt.create({
                        data: {
                            provider: providerEnum,
                            reference: input.reference,
                            amount,
                            receiverName,
                            payerName, // <— store payer name
                            status,
                            data: receiptData,
                            userId: ctx.session.user.id,
                            packageId: input.packageId,
                            creditedTokens: pkg.tokens,
                        },
                    }),
                    ctx.db.user.update({
                        where: { id: ctx.session.user.id },
                        data: { tokens: { increment: pkg.tokens } },
                        select: { tokens: true },
                    }),
                ])

                return {
                    ok: true as const,
                    credited: pkg.tokens,
                    tokens: updated.tokens,
                    provider: input.provider,
                    reference: input.reference,
                }
            } catch (e: unknown) {
                // Handle unique constraint race
                if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                    throw new TRPCError({ code: "CONFLICT", message: "This reference number has already been used." })
                }
                throw e
            }
        }),
})