/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
                // allow hosted demo overrides (optional)
                config: z
                    .object({
                        platformOwnerFullName: z.string().min(1).optional(),
                        cbeAccountSuffix: z.string().regex(/^\d{8}$/).optional(),
                        abyssiniaAccountSuffix: z.string().regex(/^\d{5}$/).optional(),
                    })
                    .optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const pkg = PACKAGES[input.packageId as 1 | 2 | 3]
            if (!pkg) {
                console.warn("[purchase.verifyAndCredit] Invalid package", { packageId: input.packageId })
                throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid package" })
            }

            console.log("[purchase.verifyAndCredit] Start", {
                userId: ctx.session.user.id,
                provider: input.provider,
                reference: input.reference,
                packageId: input.packageId,
            })

            // Duplicate guard
            const providerEnum = input.provider as PaymentProvider
            const existing = await ctx.db.receipt.findUnique({
                where: { provider_reference: { provider: providerEnum, reference: input.reference } },
            })
            if (existing) {
                console.warn("[purchase.verifyAndCredit] Duplicate reference detected", {
                    provider: input.provider,
                    reference: input.reference,
                })
                throw new TRPCError({ code: "CONFLICT", message: "This reference number has already been used." })
            }

            const uc = await ctx.db.userConfig.findUnique({ where: { userId: ctx.session.user.id } })

            const expectedOwner = normalizeName(
                input.config?.platformOwnerFullName ??
                    uc?.platformOwnerFullName ??
                    process.env.PLATFORM_OWNER_FULLNAME ??
                    "",
            )
            const cbeSuffix =
                input.config?.cbeAccountSuffix ?? uc?.cbeAccountSuffix ?? process.env.CBE_ACCOUNT_SUFFIX ?? ""
            const abyssiniaSuffix =
                input.config?.abyssiniaAccountSuffix ??
                uc?.abyssiniaAccountSuffix ??
                process.env.ABYSSINIA_ACCOUNT_SUFFIX ??
                ""

            console.log("[purchase.verifyAndCredit] Resolved config", {
                expectedOwner,
                cbeSuffix,
                abyssiniaSuffix,
                telebirrNumber: uc?.telebirrNumber,
                cbeAccountNumber: uc?.cbeAccountNumber,
            })

            let amount: number
            let receiverName: string
            let payerName: string
            let status: string | undefined
            let receiptData: Prisma.InputJsonObject
            let receiverAccount: string | undefined

            if (input.provider === "telebirr") {
                console.log("[purchase.verifyAndCredit] Telebirr verify request", { reference: input.reference })
                const result = await client.verifyTelebirr({ reference: input.reference })
                if (!result.ok) {
                    console.error("[purchase.verifyAndCredit] Telebirr verify failed", { error: result.error })
                    throw new TRPCError({ code: "BAD_REQUEST", message: result.error ?? "Verification failed" })
                }
                amount = result.data.amount
                receiverName = result.data.receiverName ?? ""
                receiverAccount = result.data.receiverAccount
                payerName = result.data.payerName ?? ""
                status = result.data.status ?? result.data.statusText
                console.log("[purchase.verifyAndCredit] Telebirr response parsed", {
                    amount,
                    receiverName,
                    receiverAccount,
                    payerName,
                    status,
                })
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
                    accountSuffix: cbeSuffix,
                })
                if (!result.ok) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: result.error ?? "Verification failed" })
                }
                amount = result.data.amount
                receiverName = result.data.receiverName ?? ""
                receiverAccount = result.data.receiverAccount
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
                    suffix: abyssiniaSuffix,
                })
                if (!result.ok) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: result.error ?? "Verification failed" })
                }
                amount = result.data.amount
                receiverName = result.data.receiverName ?? ""
                receiverAccount = undefined // Abyssinia API may not return receiver account
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
                console.warn("[purchase.verifyAndCredit] Amount mismatch", { expected: pkg.price, got: amount })
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Amount mismatch: expected ${pkg.price} ETB, got ${amount} ETB`,
                })
            }

            // Name check from DB config (fallback to env)
            console.log("[purchase.verifyAndCredit] Receiver name check", {
                normalizedReceiver: normalizeName(receiverName),
                expectedOwner,
            })
            if (expectedOwner && normalizeName(receiverName) !== expectedOwner) {
                console.warn("[purchase.verifyAndCredit] Unexpected receiver account", { receiverName, expectedOwner })
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Payment received by unexpected account",
                })
            }

            // Optional account checks if user provided them
            if (input.provider === "telebirr" && uc?.telebirrNumber && receiverAccount) {
                console.log("[purchase.verifyAndCredit] Telebirr receiver account check", {
                    receiverAccount,
                    expectedReceiverAccount: uc.telebirrNumber,
                })
                if (normalizeName(receiverAccount) !== normalizeName(uc.telebirrNumber)) {
                    console.warn("[purchase.verifyAndCredit] Unexpected Telebirr destination", {
                        receiverAccount,
                        expectedReceiverAccount: uc.telebirrNumber,
                    })
                    throw new TRPCError({ code: "BAD_REQUEST", message: "Payment to unexpected Telebirr number" })
                }
            }
            if (input.provider === "cbe" && uc?.cbeAccountNumber && receiverAccount) {
                if (normalizeName(receiverAccount) !== normalizeName(uc.cbeAccountNumber)) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: "Payment to unexpected CBE account" })
                }
            }

            try {
                console.log("[purchase.verifyAndCredit] Writing receipt and crediting tokens", {
                    tokens: pkg.tokens,
                    amount,
                    provider: input.provider,
                    reference: input.reference,
                })
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

                console.log("[purchase.verifyAndCredit] Success", {
                    credited: pkg.tokens,
                    tokens: updated.tokens,
                })
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
                    console.warn("[purchase.verifyAndCredit] Unique constraint race", {
                        provider: input.provider,
                        reference: input.reference,
                    })
                    throw new TRPCError({ code: "CONFLICT", message: "This reference number has already been used." })
                }
                console.error("[purchase.verifyAndCredit] Unhandled error", e)
                throw e
            }
        }),
})