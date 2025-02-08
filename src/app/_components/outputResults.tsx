"use client";

import { useState } from "react";

import { api } from "@/trpc/react";
import { Spinner } from "@/components/spinner";

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
  const [fixes, setFixes] = useState<Record<number, string>>({});

  if (isLoading || data === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) return <p>Error: {error.message}</p>;

  const handleFix = async (index: number, vulnerability: any) => {
    const result = await fixVulnerability.mutateAsync(vulnerability);
    if (result.fixedCode) {
      setFixes((prev) => ({ ...prev, [index]: result.fixedCode }));
    }
  };

  const vulns = data.result;

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Semgrep Scan Results</h1>
      {vulns?.length > 0 ? (
        <ul className="space-y-4">
          {vulns.map((result, index) => (
            <li key={index} className="rounded-lg border p-4 shadow">
              <p className="text-lg font-bold">{result.file}</p>
              <p>
                <strong>Start:</strong> Line {result.startLine} at column{" "}
                {result.startCol} | <strong>End:</strong> Line {result.endLine}{" "}
                at column {result.endCol}
              </p>
              <p
                className={`font-semibold ${result.severity === "WARNING" ? "text-yellow-500" : "text-red-500"}`}
              >
                {result.severity}
              </p>
              <p>{result.message}</p>
              <pre className="mt-2 rounded bg-gray-800 p-2 text-white">
                {result.code}
              </pre>
              <button
                onClick={() => handleFix(index, result)}
                className="mt-2 rounded-md bg-blue-500 px-3 py-1 text-white"
              >
                Fix
              </button>
              {fixes[index] && (
                <div className="mt-4">
                  <h3 className="font-bold text-green-500">Fixed Code:</h3>
                  <pre className="rounded bg-gray-900 p-2 text-white">
                    {fixes[index]}
                  </pre>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-green-600">No security issues found.</p>
      )}
    </div>
  );
}
