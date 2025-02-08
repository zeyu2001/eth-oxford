import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const semgrepRouter = createTRPCRouter({
  scanResults: publicProcedure
    .input(z.object({ repositoryId: z.string() }))
    .query(async ({ ctx, input }) => {
      const scan = await ctx.db.scan.findMany({
        where: {
          repositoryId: input.repositoryId,
        },
        include: {
          result: true,
        },
      });

      if (!scan) {
        throw new Error("No scan results found for this repository.");
      }

      return scan;
    }),

  scanResultById: publicProcedure
    .input(z.object({ id: z.number(), repositoryId: z.string() }))
    .query(async ({ ctx, input }) => {
      const scan = await ctx.db.scan.findUnique({
        where: {
          id: input.id,
          repositoryId: input.repositoryId,
        },
        include: {
          result: true,
        },
      });

      if (!scan) {
        throw new Error("No scan results found for this scan ID.");
      }

      return scan;
    }),
});
