"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function SecurityScan({ tempDir }: { tempDir: string }) {
    const { data, isLoading, error } = api.semgrep.scanFiles.useQuery({ directory: tempDir }, { enabled: !!tempDir, });
    const fixVulnerability = api.fixer.fixVulnerabilities.useMutation();
    const [fixes, setFixes] = useState<{ [key: number]: string }>({});
  
    if (isLoading) return <p>Scanning files...</p>;
    if (error) return <p>Error: {error.message}</p>;
  
    const handleFix = async (index: number, vulnerability: any) => {
        const result = await fixVulnerability.mutateAsync(vulnerability);
        if (result.fixedCode) {
          setFixes((prev) => ({ ...prev, [index]: result.fixedCode }));
        }
      };

      return (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Semgrep Scan Results</h1>
          {data?.length > 0 ? (
            <ul className="space-y-4">
              {data.map((result, index) => (
                <li key={index} className="border p-4 rounded-lg shadow">
                  <p className="font-bold text-lg">{result.file}</p>
                  <p>
                    <strong>Start:</strong> {result.start} | <strong>End:</strong> {result.end}
                  </p>
                  <p className={`font-semibold ${result.severity === "WARNING" ? "text-yellow-500" : "text-red-500"}`}>
                    {result.severity}
                  </p>
                  <p>{result.message}</p>
                  <pre className="bg-gray-800 text-white p-2 mt-2 rounded">{result.codeSnippet}</pre>
                  <button
                    onClick={() => handleFix(index, result)}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md"
                  >
                    Fix
                  </button>
                  {fixes[index] && (
                    <div className="mt-4">
                      <h3 className="font-bold text-green-500">Fixed Code:</h3>
                      <pre className="bg-gray-900 text-white p-2 rounded">{fixes[index]}</pre>
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

