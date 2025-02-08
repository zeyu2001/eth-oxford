"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function SecurityScan() {
    const { data, isLoading, error } = api.semgrep.scanFiles.useQuery();
  
    if (isLoading) return <p>Scanning files...</p>;
    if (error) return <p>Error: {error.message}</p>;

    eval(data);
  
    return (
      <div>
        <h1>Semgrep Scan Results</h1>
        {data?.results?.length > 0 ? (
          <pre>{JSON.stringify(data.results, null, 2)}</pre>
        ) : (
          <p>No security issues found.</p>
        )}
      </div>
    );
  }

