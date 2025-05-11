-- CreateTable
CREATE TABLE "POAPClaim" (
    "id" TEXT NOT NULL,
    "poapId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "distributionMethodId" TEXT NOT NULL,
    "transactionSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POAPClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "POAPClaim_poapId_idx" ON "POAPClaim"("poapId");

-- CreateIndex
CREATE INDEX "POAPClaim_walletAddress_idx" ON "POAPClaim"("walletAddress");

-- CreateIndex
CREATE INDEX "POAPClaim_distributionMethodId_idx" ON "POAPClaim"("distributionMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "POAPClaim_poapId_walletAddress_key" ON "POAPClaim"("poapId", "walletAddress");

-- AddForeignKey
ALTER TABLE "POAPClaim" ADD CONSTRAINT "POAPClaim_poapId_fkey" FOREIGN KEY ("poapId") REFERENCES "Poap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POAPClaim" ADD CONSTRAINT "POAPClaim_distributionMethodId_fkey" FOREIGN KEY ("distributionMethodId") REFERENCES "DistributionMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE; 