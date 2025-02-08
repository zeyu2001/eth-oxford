import { db } from "@/server/db";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> },
) {
  const { owner, repo } = await params;

  const scanResults = await db.scan.findFirst({
    where: {
      repositoryId: `${owner}/${repo}`,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      result: true,
    },
  });

  if (!scanResults) {
    return NextResponse.json(
      { error: "No scan results found" },
      { status: 404 },
    );
  }

  return NextResponse.json(scanResults, { status: 200 });
}
