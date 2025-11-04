import { postRouter } from "@/server/api/routers/post"
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc"
import { purchaseRouter } from "./routers/purchase";
import { userRouter } from "./routers/user";
import { verifyRouter } from "./routers/verify";
import { userConfigRouter } from "./routers/user-config"; // add user-config router

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  purchase: purchaseRouter,
  user: userRouter,
  verify: verifyRouter, // add verification-only router
  userConfig: userConfigRouter, // expose per-user testing config router
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
