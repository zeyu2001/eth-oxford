"use client";

import Metamask from "@/app/_components/metamask";
import { Spinner } from "@/components/spinner";
import { api } from "@/trpc/react";
import {
  AlertCircle,
  ChevronRightIcon,
  OctagonAlert,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const statuses = {
  passed: "text-green-400 bg-green-400/10",
  warn: "text-yellow-400 bg-yellow-400/10",
  error: "text-rose-400 bg-rose-400/10",
  info: "text-blue-400 bg-blue-400/10",
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Page() {
  const params = useParams();
  const repositoryId = `${params.owner as string}/${params.repo as string}`;

  const {
    data: scanResults,
    isLoading,
    error,
  } = api.semgrep.scanResults.useQuery({ repositoryId });

  if (isLoading || scanResults === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) return <p>Error: {error.message}</p>;

  const results = scanResults.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Results</h1>
      <Metamask repositoryId={repositoryId} />
      <ul className="divide-y divide-white/5">
        {results.map((result) => {
          const numError = result.result.filter(
            (vuln) => vuln.severity === "ERROR",
          ).length;

          const numWarn = result.result.filter(
            (vuln) => vuln.severity === "WARNING",
          ).length;

          const numInfo = result.result.filter(
            (vuln) => vuln.severity === "INFO",
          ).length;

          const status =
            numError > 0
              ? "error"
              : numWarn > 0
                ? "warn"
                : numInfo > 0
                  ? "info"
                  : "passed";

          return (
            <li
              key={result.id}
              className="relative flex items-center space-x-4 py-4"
            >
              <div className="min-w-0 flex-auto">
                <div className="flex items-center gap-x-3">
                  <div
                    className={classNames(
                      statuses[status],
                      "flex-none rounded-full p-1",
                    )}
                  >
                    <div className="size-2 rounded-full bg-current" />
                  </div>
                  <h2 className="min-w-0 text-sm/6 font-semibold text-white">
                    <Link
                      href={`/repositories/${params.owner as string}/${params.repo as string}/${result.id}`}
                      className="flex gap-x-2"
                    >
                      <span className="whitespace-nowrap">
                        {result.result.length} issues
                      </span>
                      <span className="absolute inset-0" />
                    </Link>
                  </h2>
                </div>
                <div className="mt-3 flex items-center gap-x-2.5 text-xs/5 text-gray-400">
                  <p className="truncate">Scanned by {result.username}</p>
                  <svg
                    viewBox="0 0 2 2"
                    className="size-0.5 flex-none fill-gray-300"
                  >
                    <circle r={1} cx={1} cy={1} />
                  </svg>
                  <p className="whitespace-nowrap">
                    {result.updatedAt.toDateString()} at{" "}
                    {result.updatedAt.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {numError > 0 && (
                <span className="flex items-center gap-x-1 text-sm font-semibold text-red-400">
                  <OctagonAlert className="text-red-400" />
                  {numError}
                </span>
              )}
              {numWarn > 0 && (
                <span className="flex items-center gap-x-1 text-sm font-semibold text-yellow-400">
                  <TriangleAlert className="text-yellow-400" />
                  {numWarn}
                </span>
              )}
              {numInfo > 0 && (
                <span className="flex items-center gap-x-1 text-sm font-semibold text-blue-400">
                  <AlertCircle className="text-blue-400" />
                  {numInfo}
                </span>
              )}
              <ChevronRightIcon
                aria-hidden="true"
                className="size-5 flex-none text-gray-400"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
