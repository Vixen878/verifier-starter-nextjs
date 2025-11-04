import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { VerifierClient } from "@creofam/verifier";

type ProviderId = "telebirr" | "cbe" | "abyssinia";

const inputSchema = z.discriminatedUnion("provider", [
    z.object({
        provider: z.literal("telebirr"),
        reference: z.string().min(5, "Reference must be at least 5 characters"),
    }),
    z.object({
        provider: z.literal("cbe"),
        reference: z.string().min(5, "Reference must be at least 5 characters"),
        suffix: z.string().min(1, "Account suffix is required"),
    }),
    z.object({
        provider: z.literal("abyssinia"),
        reference: z.string().min(5, "Reference must be at least 5 characters"),
        suffix: z.string().min(1, "Suffix is required"),
    }),
]);

export type VerifyResult = {
    provider: ProviderId;
    reference: string;
    amount: number;
    currency: string;
    payerName?: string;
    payerPhone?: string;
    payerAccount?: string;
    receiverName?: string;
    receiverAccount?: string;
    txnDate: string;
    status?: string;
    statusText?: string;
    reason?: string;
    totalAmount?: number;
    serviceFee?: number;
    serviceFeeVAT?: number;
};

const client = new VerifierClient({
    apiKey: process.env.VERIFIER_API_KEY,
    timeoutMs: 20000,
});

export const verifyRouter = createTRPCRouter({
    check: publicProcedure.input(inputSchema).mutation(async ({ input }) => {
        if (input.provider === "telebirr") {
            const res = await client.verifyTelebirr({ reference: input.reference });
            if (!res.ok) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: res.error ?? "Verification failed",
                });
            }
            const d = res.data;
            const out: VerifyResult = {
                provider: "telebirr",
                reference: d.reference,
                amount: d.amount,
                currency: d.currency ?? "ETB",
                payerName: d.payerName,
                payerPhone: d.payerPhone,
                receiverName: d.receiverName,
                receiverAccount: d.receiverAccount,
                txnDate: d.txnDate,
                status: d.status,
                statusText: d.statusText,
                totalAmount: d.totalAmount,
                serviceFee: d.serviceFee,
                serviceFeeVAT: d.serviceFeeVAT,
            };
            return out;
        }

        if (input.provider === "cbe") {
            const res = await client.verifyCBE({
                reference: input.reference,
                accountSuffix: input.suffix,
            });
            if (!res.ok) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: res.error ?? "Verification failed",
                });
            }
            const d = res.data;
            const out: VerifyResult = {
                provider: "cbe",
                reference: d.reference,
                amount: d.amount,
                currency: d.currency ?? "ETB",
                payerName: d.payerName,
                payerAccount: d.payerAccount,
                receiverName: d.receiverName,
                receiverAccount: d.receiverAccount,
                txnDate: d.txnDate,
                reason: d.reason,
            };
            return out;
        }

        // abyssinia
        const res = await client.verifyAbyssinia({
            reference: input.reference,
            suffix: input.suffix,
        });
        if (!res.ok) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: res.error ?? "Verification failed",
            });
        }
        const d = res.data;
        const out: VerifyResult = {
            provider: "abyssinia",
            reference: d.reference,
            amount: d.amount,
            currency: d.currency ?? "ETB",
            payerName: d.payerName,
            payerAccount: d.payerAccount,
            receiverName: d.receiverName,
            txnDate: d.txnDate,
            reason: d.reason,
        };
        return out;
    }),
});