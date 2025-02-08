import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { OpenAI } from "openai";
import fs from "fs/promises";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const fixResult = z.object({
  fixedCode: z.string(),
  explaination: z.string(),
  fixStartLine: z.number(),
  fixEndLine: z.number(),
  fixStartCol: z.number(),
  fixEndCol: z.number(),
});

export type FixResult = z.infer<typeof fixResult>;

export const fixerRoute = createTRPCRouter({
  fixVulnerabilities: publicProcedure
    .input(
      z.object({
        file: z.string(),
        severity: z.string(),
        message: z.string(),
        startLine: z.number(),
        startCol: z.number(),
        endLine: z.number(),
        endCol: z.number(),
        codeSnippet: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const fileContents = await fs.readFile(input.file, "utf8");
        const prompt = `
      The following code has security vulnerabilities detected by Semgrep. Your task is to fix the vulnerabilities and return the corrected code.

      Issue Details:
      - **File Name**: ${input.file}
      - **Severity**: ${input.severity}
      - **Description**: ${input.message}
      - **Problematic Lines**: ${input.startLine}:${input.startCol} - ${input.endLine}:${input.endCol}
      - **Problematic Code**:
      \`\`\`
      ${input.codeSnippet}
      \`\`\`

      The user will provide the full file contents below.

      Return the fixes in the structured format:
      - fixedCode: The fixed code snippet
      - explaination: Explanation of the fix
      - language: Programming language of the code
      - fixStartLine: Start line of the fix
      - fixEndLine: End line of the fix
      - fixStartCol: Start column of the fix
      - fixEndCol: End column of the fix

      The fix should be such that if it is inserted from fixStartLine:fixStartCol to fixEndLine:fixEndCol in the original code, it should resolve the security vulnerability.
      `;

        const completion = await openai.beta.chat.completions.parse({
          model: "gpt-4o",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: fileContents },
          ],
          response_format: zodResponseFormat(fixResult, "result"),
        });

        return completion.choices[0].message.parsed;
      } catch (error) {
        console.error("OpenAI API error:", error);
        return {
          error: "Failed to generate fix",
          details: (error as Error).message,
        };
      }
    }),
});
