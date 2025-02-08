import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getInstallation, getRepositories } from "@/lib/github";

export const userRouter = createTRPCRouter({
  installation: publicProcedure
    .input(
      z.object({
        installationId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      return await getInstallation(input.installationId);
    }),

  repositories: publicProcedure
    .input(
      z.object({
        installationId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      return await getRepositories(input.installationId);
    }),
});
