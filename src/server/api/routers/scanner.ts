import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { cloneRepository } from "@/lib/github";

export const scannerRouter = createTRPCRouter({
  scanRepository: publicProcedure
    .input(
      z.object({
        installationId: z.number(),
        repositoryId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Ensure cloneRepository handles errors or is wrapped in a try-catch if needed
        const tempDir = await cloneRepository(input.installationId, input.repositoryId);

        console.log(tempDir); // Consider removing this in production code for better logging

        return { tempDir }; // Return in an object if you plan to add more fields later
      } catch (error) {
        console.error("Failed to clone repository:", error);
        throw new Error("Repository scan failed.");
      }
    }),
});
