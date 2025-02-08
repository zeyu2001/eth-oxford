"use client";

import { SecurityScan } from "@/app/_components/scan";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const repositoryId = `${params.owner as string}/${params.repo as string}`;

  return (
    <SecurityScan
      repositoryId={repositoryId}
      scanId={parseInt(params.scan as string)}
    />
  );
}
