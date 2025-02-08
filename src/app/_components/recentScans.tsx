"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRightIcon,
  OctagonAlert,
  TriangleAlert,
} from "lucide-react";

dayjs.extend(relativeTime);

export function RecentScans() {
  const { data, isLoading, error } = api.semgrep.recentScans.useQuery();

  if (error) return <p>Error: {error.message}</p>;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>
          <h2 className="text-xl font-semibold">Recent Scans</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ul className="divide-y divide-white/5">
          {data?.map((scan, index) => {
            const numError = scan.result.filter(
              (vuln) => vuln.severity === "ERROR",
            ).length;

            const numWarn = scan.result.filter(
              (vuln) => vuln.severity === "WARNING",
            ).length;

            const numInfo = scan.result.filter(
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
                key={index}
                className="relative flex items-center space-x-4 py-4"
              >
                <div className="min-w-0 flex-auto">
                  <div className="flex items-center gap-x-3">
                    <h2 className="min-w-0 text-sm/6 font-semibold text-white">
                      <Link
                        href={`/repositories/${scan.repositoryId}/${scan.id}`}
                        className="flex gap-x-2"
                      >
                        <span className="text-md">{scan.repositoryId}</span>
                        <span className="absolute inset-0" />
                      </Link>
                    </h2>
                  </div>
                  <div className="mt-3 flex items-center gap-x-2.5 text-xs/5 text-gray-400">
                    <p className="truncate">Scanned by {scan.username}</p>
                    <svg
                      viewBox="0 0 2 2"
                      className="size-0.5 flex-none fill-gray-300"
                    >
                      <circle r={1} cx={1} cy={1} />
                    </svg>
                    <p className="whitespace-nowrap">
                      {dayjs(scan.updatedAt).fromNow()}
                    </p>
                  </div>
                </div>
                {numError > 0 && (
                  <span className="flex items-center gap-x-1 text-xs font-semibold text-red-400">
                    <OctagonAlert className="text-red-400" size={16} />
                    {numError}
                  </span>
                )}
                {numWarn > 0 && (
                  <span className="flex items-center gap-x-1 text-xs font-semibold text-yellow-400">
                    <TriangleAlert className="text-yellow-400" size={16} />
                    {numWarn}
                  </span>
                )}
                {numInfo > 0 && (
                  <span className="flex items-center gap-x-1 text-xs font-semibold text-blue-400">
                    <AlertCircle className="text-blue-400" size={16} />
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
      </CardContent>
    </Card>
  );
}
