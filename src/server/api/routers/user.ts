import type { PrismaClient } from "@prisma/client"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { z } from "zod";

export const userRouter = createTRPCRouter({
    getTokens: protectedProcedure.query(async ({ ctx }) => {
        const db = ctx.db as PrismaClient
        const me = await db.user.findUnique({
            where: { id: ctx.session.user.id },
            select: { tokens: true },
        })
        
        const tokens = me?.tokens ?? 0
        return { tokens }
    }),
    getLinkedAccounts: protectedProcedure.query(async ({ ctx }) => {
        const accounts = await ctx.db.account.findMany({
            where: { userId: ctx.session.user.id },
            select: { provider: true },
        })
        return accounts.map((a) => a.provider)
    }),
    unlinkProvider: protectedProcedure
        .input(z.enum(["google", "discord"]))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.account.deleteMany({
                where: { userId: ctx.session.user.id, provider: input },
            });
            return { ok: true };
        }),
})