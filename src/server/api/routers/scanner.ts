import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { cloneRepository } from "@/lib/github";

export const scannerRouter = createTRPCRouter({
  scanRepository: publicProcedure
    .input(
      z.object({
        installationId: z.number(),
        repositoryId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const tempDir = await cloneRepository(
        input.installationId,
        input.repositoryId,
      );

      console.log(tempDir);
    }),
});
