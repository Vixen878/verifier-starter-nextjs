import type { PrismaClient } from "@prisma/client"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"

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
})