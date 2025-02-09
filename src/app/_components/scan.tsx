"use client";

import { useState } from "react";

import { api } from "@/trpc/react";
import { Spinner } from "@/components/spinner";
import CodeMirror from "@uiw/react-codemirror";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { Button } from "@/components/ui/button";
import { type FixResult } from "@/server/api/routers/fixer";
import {
  CircleAlertIcon,
  ExternalLinkIcon,
  GitPullRequestArrowIcon,
  HammerIcon,
  OctagonAlertIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useUserStore } from "@/stores/use-user-store";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FinalFixResult = FixResult & { fixedFile: string };

export function SecurityScan({
  repositoryId,
  scanId,
}: Readonly<{
  repositoryId: string;
  scanId: number;
}>): JSX.Element {
  const { data, isLoading, error } = api.semgrep.scanResultById.useQuery({
    repositoryId,
    id: scanId,
  });
  const fixVulnerability = api.fixer.fixVulnerabilities.useMutation();
  const pullRequest = api.scanner.createPullRequest.useMutation();
  const [fixes, setFixes] = useState<Record<number, FinalFixResult>>({});
  const [pr, setPr] = useState<Record<number, string>>({});

  const installationId = useUserStore((state) => state.installationId);
  const [isFixing, setIsFixing] = useState(false);
  const [isMakingPR, setIsMakingPR] = useState(false);

  if (isLoading || data === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) return <p>Error: {error.message}</p>;

  const handleFix = async (
    index: number,
    vulnerability: (typeof data.result)[0],
  ) => {
    setIsFixing(true);
    const result = await fixVulnerability.mutateAsync({
      file: vulnerability.file,
      severity: vulnerability.severity,
      message: vulnerability.message,
      startLine: vulnerability.startLine,
      startCol: vulnerability.startCol,
      endLine: vulnerability.endLine,
      endCol: vulnerability.endCol,
      codeSnippet: vulnerability.code,
    });
    if (result === null) return setIsFixing(false);

    if ("fixedCode" in result) {
      setFixes((prev) => ({ ...prev, [index]: result }));
    }
    setIsFixing(false);
  };

  const makePullRequest = async (
    index: number,
    vulnerability: (typeof data.result)[0],
  ) => {
    setIsMakingPR(true);
    const title = vulnerability.file.split("/")[4];
    const filepath = vulnerability.file.split("/").slice(2).join("/");
    const input = {
      installationId: installationId!,
      repositoryId,
      title: `Fix vulnerability in ${title}`,
      body: `# Vulnerability Fix
${vulnerability.message}
      
## Details

- **Affected File**: \`${vulnerability.file}\`
- **Severity**: ${vulnerability.severity}
- **Affected Lines**: ${vulnerability.startLine}:${vulnerability.startCol} - ${vulnerability.endLine}:${vulnerability.endCol}

## Vulnerable Code

\`\`\`
${vulnerability.code}
\`\`\`
`,
      filepath: filepath,
      newFileContent: fixes[index]!.fixedFile,
    };
    const result = await pullRequest.mutateAsync(input);
    if (result.madePR) {
      setPr((prev) => ({ ...prev, [index]: result.madePR.data.html_url }));
    }
    setIsMakingPR(false);
  };

  const vulns = data.result;

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Code Analysis Results</h1>
      {vulns?.length > 0 ? (
        <ul className="space-y-4">
          {vulns.map((result, index) => (
            <Card key={index} className="max-w-5xl">
              <CardHeader>
                <p className="text-md flex items-center">
                  <span
                    className={`flex items-center font-bold ${
                      result.severity === "ERROR"
                        ? "text-red-500"
                        : result.severity === "WARNING"
                          ? "text-yellow-500"
                          : "text-blue-400"
                    }`}
                  >
                    {result.severity === "ERROR" ? (
                      <OctagonAlertIcon className="mr-2 h-4 w-4" />
                    ) : result.severity === "WARNING" ? (
                      <TriangleAlertIcon className="mr-2 h-4 w-4" />
                    ) : (
                      <CircleAlertIcon className="mr-2 h-4 w-4" />
                    )}
                    {result.severity}
                  </span>
                  <span className="ml-4 truncate font-semibold">
                    {result.file.split("/").slice(2).join("/")}
                  </span>
                </p>
                <CardDescription>
                  Line {result.startLine}:{result.startCol} - Line{" "}
                  {result.endLine}:{result.endCol}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-sm">{result.message}</p>
                <CodeMirror
                  value={result.code}
                  readOnly={true}
                  theme={okaidia}
                  basicSetup={{
                    lineNumbers: false,
                  }}
                  className="my-2"
                />
                <Button
                  onClick={() => handleFix(index, result)}
                  className="mt-2"
                  disabled={isFixing}
                >
                  {isFixing ? (
                    <Spinner size="sm" />
                  ) : (
                    <HammerIcon className="mr-2 h-4 w-4" />
                  )}
                  Fix Vulnerability
                </Button>
                {fixes[index] && (
                  <div className="mt-4">
                    <h3 className="font-bold text-green-500">Fixed Code:</h3>
                    <CodeMirror
                      value={fixes[index].fixedCode}
                      readOnly={true}
                      theme={okaidia}
                      basicSetup={{
                        lineNumbers: false,
                      }}
                      className="my-2"
                    />
                    {pr[index] ? (
                      <Button className="mt-2">
                        <Link
                          href={pr[index]}
                          target="_blank"
                          className="flex items-center"
                        >
                          <ExternalLinkIcon className="mr-2 h-4 w-4" />
                          <span className="mr-1">View Pull Request</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => makePullRequest(index, result)}
                        className="mt-2"
                        disabled={isMakingPR}
                      >
                        {isMakingPR ? (
                          <Spinner size="sm" />
                        ) : (
                          <GitPullRequestArrowIcon className="mr-2 h-4 w-4" />
                        )}
                        Make PR
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </ul>
      ) : (
        <p className="text-green-600">No security issues found.</p>
      )}
    </div>
  );
}
