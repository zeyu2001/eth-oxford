import { userRouter } from "@/server/api/routers/user";
import { scannerRouter } from "./routers/scanner";
import { semgrepRouter } from "./routers/semgrep";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { fixerRoute } from "./routers/fixer";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  scanner: scannerRouter,
  //post: postRouter,
  semgrep: semgrepRouter,
  fixer: fixerRoute,
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
