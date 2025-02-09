import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  cloneRepository,
  commitFile,
  createBranch,
  createPR,
  getDefaultBranch,
  getFileSHA,
  getLatestSha,
} from "@/lib/github";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

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
          "--json-output=output.json",
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
            JSON.parse(readFileSync("output.json", "utf8")),
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
        } catch (error) {
          throw new Error(
            "Failed to parse Semgrep output: " + (error as Error).message,
          );
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

        // const child = spawn(
        //   "npx",
        //   [
        //     "hardhat",
        //     "run",
        //     "--network",
        //     "coston",
        //     "--config",
        //     "hardhat.config.cjs",
        //     "scripts/upload.ts",
        //   ],
        //   {
        //     env: {
        //       ...process.env,
        //       TS_NODE_PROJECT: "tsconfig.hardhat.json",
        //       REPOSITORY_ID: input.repositoryId,
        //     },
        //   },
        // );

        // child.stdout.on("data", (data) => {
        //   console.log(`stdout: ${data}`);
        // });
        // child.stderr.on("data", (data) => {
        //   console.error(`stderr: ${data}`);
        // });
        // child.on("close", (code) => {
        //   console.log(`child process exited with code ${code}`);
        // });

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
        filepath: z.string(),
        newFileContent: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const branchName = `security/codecure-${input.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

      const defaultBranch = await getDefaultBranch(
        input.installationId,
        input.repositoryId,
      );

      const branchLatestSHA = await getLatestSha(
        input.installationId,
        input.repositoryId,
        defaultBranch,
      );
      console.log(0);

      const result = await createBranch(
        input.installationId,
        input.repositoryId,
        branchName,
        branchLatestSHA,
      );

      console.log(1);
      console.log(result);

      const fileSHA = await getFileSHA(
        input.installationId,
        input.repositoryId,
        branchName,
        input.filepath,
      );
      console.log(2);
      console.log(fileSHA);

      const commitResult = await commitFile(
        input.installationId,
        input.repositoryId,
        branchName,
        input.filepath,
        input.newFileContent,
        `Add security vulnerability fix at ${input.filepath}`,
        fileSHA,
      );

      console.log(commitResult);

      const prResult = await createPR(
        input.installationId,
        input.repositoryId,
        `[CodeCure] ${input.title}`,
        input.body,
        branchName,
        "main",
      );

      return { madePR: prResult };
    }),
});
