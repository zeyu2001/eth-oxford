import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { exec } from "child_process";
import util from "util";
import { OpenAI } from "openai";
import fs from 'fs/promises';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const fixerRoute = createTRPCRouter({
  fixVulnerabilities: publicProcedure
  .input((v) => v)
  .mutation(async ({ input }) => {
    try {
      const fileContents = await fs.readFile(input.file, 'utf8');  
      const prompt = `
      The following code has security vulnerabilities detected by Semgrep. Your task is to fix the vulnerabilities and return the corrected code.

      Issue Details:
      - **File Name**: ${input.file}
      - **Severity**: ${input.severity}
      - **Description**: ${input.message}
      - **Problematic Lines**: Start at ${input.start}, ends at ${input.end}
      - **Problematic Code**:
      \`\`\`
      ${input.codeSnippet}
      \`\`\`
      - **Full code**:
      \`\`\`
      ${fileContents}
      \`\`\`

      Please return the fixed code in a code block without any additional explanation.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      console.log(response)

      return { fixedCode: response.choices[0].message.content };
    } catch (error: any) {
      console.error("OpenAI API error:", error);
      return { error: "Failed to generate fix", details: error.message };
    }
  }),
});
