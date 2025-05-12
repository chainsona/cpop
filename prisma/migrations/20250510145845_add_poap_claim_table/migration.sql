-- CreateTable
CREATE TABLE "POPClaim" (
    "id" TEXT NOT NULL,
    "popId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "distributionMethodId" TEXT NOT NULL,
    "transactionSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POPClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "POPClaim_popId_idx" ON "POPClaim"("popId");

-- CreateIndex
CREATE INDEX "POPClaim_walletAddress_idx" ON "POPClaim"("walletAddress");

-- CreateIndex
CREATE INDEX "POPClaim_distributionMethodId_idx" ON "POPClaim"("distributionMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "POPClaim_popId_walletAddress_key" ON "POPClaim"("popId", "walletAddress");

-- AddForeignKey
ALTER TABLE "POPClaim" ADD CONSTRAINT "POPClaim_popId_fkey" FOREIGN KEY ("popId") REFERENCES "Pop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POPClaim" ADD CONSTRAINT "POPClaim_distributionMethodId_fkey" FOREIGN KEY ("distributionMethodId") REFERENCES "DistributionMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE; 