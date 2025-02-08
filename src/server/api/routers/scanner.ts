import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  cloneRepository,
  commitFile,
  createBranch,
  createPR,
} from "@/lib/github";
import { spawnSync } from "node:child_process";

export const scannerRouter = createTRPCRouter({
  scanRepository: publicProcedure
    .input(
      z.object({
        installationId: z.number(),
        repositoryId: z.string(),
        username: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const tempDir = await cloneRepository(
          input.installationId,
          input.repositoryId,
        );

        const { stdout, stderr } = spawnSync("semgrep", [
          "scan",
          "--config=auto",
          tempDir,
          "--json",
        ]);

        const vulnerabilitySchema = z.object({
          path: z.string(),
          start: z.object({
            line: z.number(),
            col: z.number(),
          }),
          end: z.object({
            line: z.number(),
            col: z.number(),
          }),
          extra: z.object({
            severity: z.string(),
            message: z.string(),
            lines: z.string(),
          }),
        });

        const semgrepOutputSchema = z.object({
          results: z.array(vulnerabilitySchema),
        });

        let formattedResults = [];
        try {
          const scanResults = semgrepOutputSchema.parse(
            JSON.parse(stdout.toString()),
          );
          formattedResults = scanResults.results.map((vuln) => ({
            file: vuln.path,
            startLine: vuln.start.line,
            startCol: vuln.start.col,
            endLine: vuln.end.line,
            endCol: vuln.end.col,
            severity: vuln.extra.severity,
            message: vuln.extra.message,
            code: vuln.extra.lines,
          }));
        } catch {
          throw new Error("Failed to parse Semgrep output.");
        }

        const scan = await ctx.db.scan.create({
          data: {
            username: input.username,
            repositoryId: input.repositoryId,
            result: {
              create: formattedResults,
            },
          },
        });

        return scan;
      } catch (error) {
        console.error("Failed to clone repository:", error);
        throw new Error("Repository scan failed.");
      }
    }),

  createPullRequest: publicProcedure
    .input(
      z.object({
        installationId: z.number(),
        repositoryId: z.string(),
        title: z.string(),
        body: z.string(),
        currSHA: z.string(),
        filepath: z.string(),
        newFileContent: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const branchName = `security/codecure-${input.title.toLowerCase().replace(" ", "-")}`;

      const result = await createBranch(
        input.installationId,
        input.repositoryId,
        branchName,
        input.currSHA,
      );

      const commitResult = await commitFile(
        input.installationId,
        input.repositoryId,
        branchName,
        input.filepath,
        input.newFileContent,
        `Add security vulnerability fix at ${input.filepath}`,
      );

      const prResult = await createPR(
        input.installationId,
        input.repositoryId,
        input.title,
        input.body,
        branchName,
        "main",
      );

      return prResult;
    }),
});
