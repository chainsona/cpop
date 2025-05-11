-- CreateEnum
CREATE TYPE "PoapStatus" AS ENUM ('Draft', 'Published', 'Distributed', 'Unclaimable');

-- CreateEnum
CREATE TYPE "DistributionType" AS ENUM ('ClaimLinks', 'SecretWord', 'LocationBased', 'Airdrop');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('Physical', 'Online');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('Public', 'Unlisted', 'Private');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "walletAddress" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poap" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "website" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PoapStatus" NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attendees" INTEGER,
    "creatorId" TEXT,

    CONSTRAINT "Poap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionMethod" (
    "id" TEXT NOT NULL,
    "poapId" TEXT NOT NULL,
    "type" "DistributionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DistributionMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimLink" (
    "id" TEXT NOT NULL,
    "distributionMethodId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "claimedByWallet" TEXT,
    "transactionSignature" TEXT,

    CONSTRAINT "ClaimLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretWord" (
    "id" TEXT NOT NULL,
    "distributionMethodId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "maxClaims" INTEGER,
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecretWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationBased" (
    "id" TEXT NOT NULL,
    "distributionMethodId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "radius" INTEGER NOT NULL DEFAULT 500,
    "maxClaims" INTEGER,
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationBased_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Attributes" (
    "id" TEXT NOT NULL,
    "poapId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL DEFAULT 'Physical',
    "platform" TEXT,
    "city" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "platformUrl" TEXT,

    CONSTRAINT "Attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "attributesId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "attributesId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "poapId" TEXT NOT NULL,
    "defaultStartDate" TIMESTAMP(3),
    "defaultEndDate" TIMESTAMP(3),
    "includeTime" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "Visibility" NOT NULL DEFAULT 'Public',
    "allowSearch" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnClaim" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoapToken" (
    "id" TEXT NOT NULL,
    "poapId" TEXT NOT NULL,
    "mintAddress" TEXT NOT NULL,
    "supply" INTEGER NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadataUri" TEXT,
    "metadataUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "PoapToken_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "Poap_creatorId_idx" ON "Poap"("creatorId");

-- CreateIndex
CREATE INDEX "Poap_status_idx" ON "Poap"("status");

-- CreateIndex
CREATE INDEX "DistributionMethod_poapId_idx" ON "DistributionMethod"("poapId");

-- CreateIndex
CREATE INDEX "DistributionMethod_type_idx" ON "DistributionMethod"("type");

-- CreateIndex
CREATE INDEX "DistributionMethod_disabled_idx" ON "DistributionMethod"("disabled");

-- CreateIndex
CREATE INDEX "DistributionMethod_deleted_idx" ON "DistributionMethod"("deleted");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimLink_token_key" ON "ClaimLink"("token");

-- CreateIndex
CREATE INDEX "ClaimLink_distributionMethodId_idx" ON "ClaimLink"("distributionMethodId");

-- CreateIndex
CREATE INDEX "ClaimLink_claimed_idx" ON "ClaimLink"("claimed");

-- CreateIndex
CREATE INDEX "ClaimLink_claimedAt_idx" ON "ClaimLink"("claimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecretWord_distributionMethodId_key" ON "SecretWord"("distributionMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "LocationBased_distributionMethodId_key" ON "LocationBased"("distributionMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "Airdrop_distributionMethodId_key" ON "Airdrop"("distributionMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "Attributes_poapId_key" ON "Attributes"("poapId");

-- CreateIndex
CREATE INDEX "Attributes_poapId_idx" ON "Attributes"("poapId");

-- CreateIndex
CREATE INDEX "Artist_attributesId_idx" ON "Artist"("attributesId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_attributesId_key" ON "Organization"("attributesId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_poapId_key" ON "Settings"("poapId");

-- CreateIndex
CREATE INDEX "Settings_poapId_idx" ON "Settings"("poapId");

-- CreateIndex
CREATE UNIQUE INDEX "PoapToken_mintAddress_key" ON "PoapToken"("mintAddress");

-- CreateIndex
CREATE INDEX "PoapToken_poapId_idx" ON "PoapToken"("poapId");

-- CreateIndex
CREATE INDEX "POAPClaim_poapId_idx" ON "POAPClaim"("poapId");

-- CreateIndex
CREATE INDEX "POAPClaim_walletAddress_idx" ON "POAPClaim"("walletAddress");

-- CreateIndex
CREATE INDEX "POAPClaim_distributionMethodId_idx" ON "POAPClaim"("distributionMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "POAPClaim_poapId_walletAddress_key" ON "POAPClaim"("poapId", "walletAddress");

-- AddForeignKey
ALTER TABLE "Poap" ADD CONSTRAINT "Poap_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionMethod" ADD CONSTRAINT "DistributionMethod_poapId_fkey" FOREIGN KEY ("poapId") REFERENCES "Poap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimLink" ADD CONSTRAINT "ClaimLink_distributionMethodId_fkey" FOREIGN KEY ("distributionMethodId") REFERENCES "DistributionMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretWord" ADD CONSTRAINT "SecretWord_distributionMethodId_fkey" FOREIGN KEY ("distributionMethodId") REFERENCES "DistributionMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationBased" ADD CONSTRAINT "LocationBased_distributionMethodId_fkey" FOREIGN KEY ("distributionMethodId") REFERENCES "DistributionMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Airdrop" ADD CONSTRAINT "Airdrop_distributionMethodId_fkey" FOREIGN KEY ("distributionMethodId") REFERENCES "DistributionMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attributes" ADD CONSTRAINT "Attributes_poapId_fkey" FOREIGN KEY ("poapId") REFERENCES "Poap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_attributesId_fkey" FOREIGN KEY ("attributesId") REFERENCES "Attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_attributesId_fkey" FOREIGN KEY ("attributesId") REFERENCES "Attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_poapId_fkey" FOREIGN KEY ("poapId") REFERENCES "Poap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoapToken" ADD CONSTRAINT "PoapToken_poapId_fkey" FOREIGN KEY ("poapId") REFERENCES "Poap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POAPClaim" ADD CONSTRAINT "POAPClaim_poapId_fkey" FOREIGN KEY ("poapId") REFERENCES "Poap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POAPClaim" ADD CONSTRAINT "POAPClaim_distributionMethodId_fkey" FOREIGN KEY ("distributionMethodId") REFERENCES "DistributionMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

