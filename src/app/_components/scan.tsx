"use client";

import { useState } from "react";

import { api } from "@/trpc/react";
import { Spinner } from "@/components/spinner";
import CodeMirror from "@uiw/react-codemirror";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { Button } from "@/components/ui/button";
import { type FixResult } from "@/server/api/routers/fixer";
import { HammerIcon } from "lucide-react";
import { useUserStore } from "@/stores/use-user-store";

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
  const [pr, setPr] = useState<Record<number, boolean>>({});

  const installationId = useUserStore((state) => state.installationId);
  const [isFixing, setIsFixing] = useState(false);

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
    const title = vulnerability.file.split("/")[4];
    const filepath = vulnerability.file.split("/").slice(2).join("/");
    const input = {
      installationId: installationId!,
      repositoryId,
      title: title!,
      body: vulnerability.message,
      filepath: filepath,
      newFileContent: fixes[index]!.fixedFile,
    };
    const result = await pullRequest.mutateAsync(input);
    if (result.madePR) {
      setPr((prev) => ({ ...prev, [index]: true }));
    }
    setIsFixing(false);
  };

  const vulns = data.result;

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Code Analysis Results</h1>
      {vulns?.length > 0 ? (
        <ul className="space-y-4">
          {vulns.map((result, index) => (
            <li key={index} className="max-w-5xl rounded-lg border p-4 shadow">
              <p className="text-md truncate font-bold">
                {result.file.split("/").slice(2).join("/")}
              </p>
              <p
                className={`font-semibold ${result.severity === "ERROR" ? "text-red-500" : result.severity === "WARNING" ? "text-yellow-500" : "text-blue-400"}`}
              >
                {result.severity}
              </p>
              <p className="text-sm">{result.message}</p>
              <p className="text-sm text-gray-500">
                Line {result.startLine}:{result.startCol} - Line{" "}
                {result.endLine}:{result.endCol}
              </p>
              <CodeMirror
                value={result.code}
                readOnly={true}
                theme={okaidia}
                basicSetup={{
                  lineNumbers: false,
                }}
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
                  <pre className="rounded bg-gray-900 p-2 text-white">
                    {fixes[index].fixedCode}
                  </pre>
                  <Button
                    onClick={() => makePullRequest(index, result)}
                    className="mt-2"
                  >
                    Make PR
                  </Button>
                </div>
              )}
              {pr[index] && <p>Pull Request Made </p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-green-600">No security issues found.</p>
      )}
    </div>
  );
}
