-- CreateTable
CREATE TABLE "Vulnerability" (
    "id" SERIAL NOT NULL,
    "file" TEXT NOT NULL,
    "startLine" INTEGER NOT NULL,
    "startCol" INTEGER NOT NULL,
    "endLine" INTEGER NOT NULL,
    "endCol" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "scanId" INTEGER,

    CONSTRAINT "Vulnerability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scan_repositoryId_idx" ON "Scan"("repositoryId");

-- AddForeignKey
ALTER TABLE "Vulnerability" ADD CONSTRAINT "Vulnerability_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
