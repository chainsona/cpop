-- AlterEnum
ALTER TYPE "DistributionType" ADD VALUE 'Airdrop';

-- CreateTable
CREATE TABLE "Airdrop" (
    "id" TEXT NOT NULL,
    "distributionMethodId" TEXT NOT NULL,
    "addresses" TEXT[],
    "maxClaims" INTEGER,
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Airdrop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Airdrop_distributionMethodId_key" ON "Airdrop"("distributionMethodId");

-- AddForeignKey
ALTER TABLE "Airdrop" ADD CONSTRAINT "Airdrop_distributionMethodId_fkey" FOREIGN KEY ("distributionMethodId") REFERENCES "DistributionMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
