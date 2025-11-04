/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"

const cfgSchema = z.object({
    platformOwnerFullName: z.string().trim().min(3).max(100).optional(),
    cbeAccountSuffix: z.string().trim().regex(/^\d{8}$/, "CBE suffix must be 8 digits").optional(),
    abyssiniaAccountSuffix: z.string().trim().regex(/^\d{5}$/, "Abyssinia suffix must be 5 digits").optional(),
    telebirrNumber: z.string().trim().regex(/^251\d{9}$/, "Telebirr number must start with 251 and be 12 digits").optional(),
    cbeAccountNumber: z.string().trim().regex(/^\d{13}$/, "CBE account must be 13 digits").optional(),
    abyssiniaAccountNumber: z.string().trim().regex(/^\d{11,16}$/, "Abyssinia account must be 11-16 digits").optional(),
})

export const userConfigRouter = createTRPCRouter({
    get: protectedProcedure.query(async ({ ctx }) => {
        const me = await ctx.db.userConfig.findUnique({
            where: { userId: ctx.session.user.id },
        })
        return me ?? null
    }),

    upsert: protectedProcedure
        .input(cfgSchema)
        .mutation(async ({ ctx, input }) => {
            const saved = await ctx.db.userConfig.upsert({
                where: { userId: ctx.session.user.id },
                update: input,
                create: { userId: ctx.session.user.id, ...input },
            })
            return saved
        }),
})