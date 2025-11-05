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

// Purchase verification and token crediting TRPC router.
// Verifies receipts against provider SDKs (Telebirr, CBE, Abyssinia),
// enforces amount, prevents duplicates, and atomically credits tokens.

const PACKAGES = {
    1: { price: 50, tokens: 50 },
    2: { price: 200, tokens: 200 },
    3: { price: 500, tokens: 500 },
} as const
// Map package IDs to price (ETB) and token credits.
// Used to validate the paid amount and decide how many tokens to grant.

const normalizeName = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ")
// Normalize names to lower-case, single-space-separated for robust comparison.

const client = new VerifierClient({
    apiKey: process.env.VERIFIER_API_KEY,
    timeoutMs: 20000,
})
// Verifier SDK client used to query provider receipts.
// Timeout keeps UX snappy and avoids hung network requests.

const onlyDigits = (s: string): string => s.replace(/\D/g, "")
// Strip all non-digit characters, e.g., normalize masked account strings.

const matchesMaskedAccount = (masked: string, full: string): boolean => {
    // Compare a masked account string (e.g., "2519****4243") to a full number.
    // When mask characters are present, we only require prefix/suffix digits to match.
    // When no mask is present, compare digits-only equality.
    const m = masked.trim()
    const f = onlyDigits(full.trim())
    const hasMask = /[*xX•]/.test(m)

    const prefixMatch = /^(\d+)/.exec(m)
    const suffixMatch = /(\d+)$/.exec(m)
    const prefix = prefixMatch?.[1] ?? ""
    const suffix = suffixMatch?.[1] ?? ""

    if (hasMask) {
        if (prefix && !f.startsWith(prefix)) return false
        if (suffix && !f.endsWith(suffix)) return false
        return true
    }

    // If not masked, compare digits-only equality
    const md = onlyDigits(m)
    return md === f
}

// purchaseRouter.verifyAndCredit mutation
export const purchaseRouter = createTRPCRouter({
    // verifyAndCredit: validates a user-provided receipt and credits tokens on success.
    verifyAndCredit: protectedProcedure
        // Strict, self-documenting input contract for verification.
        .input(
            z.object({
                // Payment provider to verify against.
                provider: z.enum(["telebirr", "cbe", "abyssinia"]),
                // User-entered reference/transaction number.
                reference: z.string().min(5),
                // Selected package (drives price and tokens to credit).
                packageId: z.number().int().positive(),
                // Optional extra config; values fall back to DB and env.
                config: z
                    .object({
                        // Expected platform owner's full name for Telebirr name check.
                        platformOwnerFullName: z.string().min(1).optional(),
                        // Suffix used with CBE reference lookups (8 digits).
                        cbeAccountSuffix: z.string().regex(/^\d{8}$/).optional(),
                        // Suffix used with Abyssinia reference lookups (5 digits).
                        abyssiniaAccountSuffix: z.string().regex(/^\d{5}$/).optional(),
                    })
                    .optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            // Resolve the selected package; guard against invalid IDs.
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

            // Duplicate guard: refuse previously used provider+reference pairs.
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

            // Load user-specific verification config from DB, with safe fallbacks to env.
            const uc = await ctx.db.userConfig.findUnique({ where: { userId: ctx.session.user.id } })

            // Normalize the expected owner name; precedence: input.config → DB → env.
            const expectedOwner = normalizeName(
                input.config?.platformOwnerFullName ??
                uc?.platformOwnerFullName ??
                process.env.PLATFORM_OWNER_FULLNAME ??
                "",
            )
            // Suffixes required by CBE and Abyssinia SDK lookups.
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

            // Parsed fields filled by provider-specific verification branches below.
            let amount: number
            let receiverName: string
            let payerName: string
            let status: string | undefined
            let receiptData: Prisma.InputJsonObject
            let receiverAccount: string | undefined

            // Telebirr verification: strict destination validation supported via masked account matching.
            if (input.provider === "telebirr") {
                console.log("[purchase.verifyAndCredit] Telebirr verify request", { reference: input.reference })
                // Call SDK to verify the reference on Telebirr.
                const result = await client.verifyTelebirr({ reference: input.reference })
                if (!result.ok) {
                    console.error("[purchase.verifyAndCredit] Telebirr verify failed", { error: result.error })
                    throw new TRPCError({ code: "BAD_REQUEST", message: result.error ?? "Verification failed" })
                }
                // Extract canonical fields used for validation and persistence.
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
                // Persist raw receipt fields to aid debugging/auditing.
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
            // CBE verification: accept mismatched receiver name due to SDK variations; rely on suffix + amount.
            } else if (input.provider === "cbe") {
                console.log("[purchase.verifyAndCredit] CBE verify request", {
                    reference: input.reference,
                    accountSuffix: cbeSuffix,
                })
                // Provide account suffix when querying CBE; prevents fraudulent references.
                const result = await client.verifyCBE({
                    reference: input.reference,
                    accountSuffix: cbeSuffix,
                })
                if (!result.ok) {
                    console.error("[purchase.verifyAndCredit] CBE verify failed", { error: result.error })
                    throw new TRPCError({ code: "BAD_REQUEST", message: result.error ?? "Verification failed" })
                }
                amount = result.data.amount
                receiverName = result.data.receiverName ?? ""
                receiverAccount = result.data.receiverAccount
                payerName = result.data.payerName ?? ""
                status = undefined // CBE SDK doesn't provide a status field.
                console.log("[purchase.verifyAndCredit] CBE response parsed", {
                    amount,
                    receiverName,
                    receiverAccount,
                    payerName,
                })
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
            // Abyssinia verification: similar to CBE; suffix + amount are authoritative.
            } else {
                console.log("[purchase.verifyAndCredit] Abyssinia verify request", {
                    reference: input.reference,
                    suffix: abyssiniaSuffix,
                })
                // Provide platform-owner suffix to the Abyssinia SDK reference lookup.
                const result = await client.verifyAbyssinia({
                    reference: input.reference,
                    suffix: abyssiniaSuffix,
                })
                if (!result.ok) {
                    console.error("[purchase.verifyAndCredit] Abyssinia verify failed", { error: result.error })
                    throw new TRPCError({ code: "BAD_REQUEST", message: result.error ?? "Verification failed" })
                }
                amount = result.data.amount
                receiverName = result.data.receiverName ?? ""
                receiverAccount = undefined // Abyssinia API may not return receiver account.
                payerName = result.data.payerName ?? ""
                status = undefined // No status from Abyssinia SDK.
                console.log("[purchase.verifyAndCredit] Abyssinia response parsed", {
                    amount,
                    receiverName,
                    payerName,
                })
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

            // Amount must exactly match the selected package price.
            if (amount !== pkg.price) {
                console.warn("[purchase.verifyAndCredit] Amount mismatch", { expected: pkg.price, got: amount })
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Amount mismatch: expected ${pkg.price} ETB, got ${amount} ETB`,
                })
            }

            console.log("[purchase.verifyAndCredit] Receiver name check", {
                normalizedReceiver: normalizeName(receiverName),
                expectedOwner,
                provider: input.provider,
            })
            // Receiver name validation:
            // - Telebirr: enforce exact normalized match to the expected owner.
            // - CBE & Abyssinia: skip name check; SDK can return misspellings, suffix + amount is sufficient.
            if (
                input.provider !== "cbe" &&
                input.provider !== "abyssinia" &&
                expectedOwner &&
                normalizeName(receiverName) !== expectedOwner
            ) {
                console.warn("[purchase.verifyAndCredit] Unexpected receiver account", {
                    receiverName,
                    expectedOwner,
                    provider: input.provider,
                })
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Payment received by unexpected account",
                })
            } else if (input.provider === "cbe" || input.provider === "abyssinia") {
                console.log("[purchase.verifyAndCredit] Name check skipped for provider; suffix + amount used", {
                    provider: input.provider,
                })
            }

            // Optional account checks if user provided them
            // Telebirr — enforce masked match with user’s number
            if (input.provider === "telebirr" && uc?.telebirrNumber && receiverAccount) {
                // Match masked SDK receiverAccount (e.g., "2519****4243") to user's configured number.
                const matches = matchesMaskedAccount(receiverAccount, uc.telebirrNumber)
                console.log("[purchase.verifyAndCredit] Telebirr receiver account check", {
                    receiverAccount,
                    expectedReceiverAccount: uc.telebirrNumber,
                    matches,
                })
                if (!matches) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: "Payment to unexpected Telebirr number" })
                }
            }
            // CBE — do not enforce receiver account equality; suffix + amount is authoritative
            if (input.provider === "cbe" && receiverAccount) {
                console.log("[purchase.verifyAndCredit] CBE receiver account info", {
                    receiverAccount,
                    usedSuffix: cbeSuffix,
                    // If user configured full account, show match info for visibility only
                    configuredAccount: uc?.cbeAccountNumber,
                    matches: uc?.cbeAccountNumber
                        ? matchesMaskedAccount(receiverAccount, uc.cbeAccountNumber)
                        : undefined,
                })
                // No throw here: we accept verification when amount matches and suffix was used
            }

            try {
                // Atomically write the receipt and credit the user's tokens.
                // The transaction prevents partial state if anything fails mid-way.
                console.log("[purchase.verifyAndCredit] Writing receipt and crediting tokens", {
                    tokens: pkg.tokens,
                    amount,
                    provider: input.provider,
                    reference: input.reference,
                })
                const [, updated] = await ctx.db.$transaction([
                    // Store a canonical receipt entry with raw provider data for auditability.
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
                    // Credit tokens to the user account.
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
                // Handle unique constraint race where another process inserted the same receipt first.
                if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                    console.warn("[purchase.verifyAndCredit] Unique constraint race", {
                        provider: input.provider,
                        reference: input.reference,
                    })
                    throw new TRPCError({ code: "CONFLICT", message: "This reference number has already been used." })
                }
                console.error("[purchase.verifyAndCredit] Unhandled error", e)
                // Bubble up unhandled errors after logging.
                throw e
            }
        }),
})