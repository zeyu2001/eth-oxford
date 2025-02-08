import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { exec } from "child_process";
import util from "util";
import { OpenAI } from "openai";
import { z } from "zod";

const execPromise = util.promisify(exec);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const semgrepRouter = createTRPCRouter({
  scanFiles: publicProcedure
  .input(z.object({ directory: z.string() }))
  .query(async ({ input }) => {
    try {
      // Run Semgrep on the src/ folder and return JSON output
      const directory = input.directory;
      console.log(`semgrep scan --config=auto ${directory} --json --json-output=semgrep.json`)
      const { stdout, stderr } = await execPromise(`semgrep scan --config=auto ${directory}/ --json --json-output=semgrep.json`);

      if (stderr) {
        console.error("Semgrep Error:", stderr);
      }

      // Parse JSON output from Semgrep
      const scanResults = JSON.parse(stdout);

      // Parse JSON output from Semgrep
      const formattedResults = scanResults.results.map((vuln: any) => ({
        file: vuln.path,
        start: `Line ${vuln.start.line}, Col ${vuln.start.col}`,
        end: `Line ${vuln.end.line}, Col ${vuln.end.col}`,
        severity: vuln.extra.severity,
        message: vuln.extra.message,
        codeSnippet: vuln.extra.lines,
      }));

      console.log(formattedResults);

      return formattedResults;
    } catch (error: any) {
      console.error("Semgrep execution failed:", error);
      return {
        error: "Semgrep scan failed",
        details: error.message || error.toString(),
      };
    }
  }),
});
