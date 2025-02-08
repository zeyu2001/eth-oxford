import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
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

  vulnerabilityStatistics: publicProcedure.query(async ({ ctx }) => {
    const scan = await ctx.db.scan.findMany({
      include: {
        result: true,
      },
    });

    if (!scan) {
      throw new Error("No scan results found.");
    }

    const statistics = scan.map((s) => {
      const numError = s.result.filter(
        (vuln) => vuln.severity === "ERROR",
      ).length;

      const numWarn = s.result.filter(
        (vuln) => vuln.severity === "WARNING",
      ).length;

      const numInfo = s.result.filter(
        (vuln) => vuln.severity === "INFO",
      ).length;

      return {
        scanId: s.id,
        numError,
        numWarn,
        numInfo,
      };
    });

    const total = statistics.reduce(
      (acc, curr) => {
        acc.error += curr.numError;
        acc.warn += curr.numWarn;
        acc.info += curr.numInfo;
        return acc;
      },
      { error: 0, warn: 0, info: 0 },
    );

    return total;
  }),

  recentScans: publicProcedure.query(async ({ ctx }) => {
    const scans = await ctx.db.scan.findMany({
      include: {
        result: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 3,
    });

    if (!scans) {
      throw new Error("No scan results found.");
    }

    return scans;
  }),
});
