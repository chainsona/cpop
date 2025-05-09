-- CreateEnum
CREATE TYPE "PoapStatus" AS ENUM ('Draft', 'Published', 'Distributed');

-- CreateEnum
CREATE TYPE "DistributionType" AS ENUM ('ClaimLinks', 'SecretWord', 'LocationBased');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('Physical', 'Online');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('Public', 'Unlisted', 'Private');

-- CreateTable
CREATE TABLE "Poap" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "website" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "supply" INTEGER,
    "status" "PoapStatus" NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionMethod" (
    "id" TEXT NOT NULL,
    "poapId" TEXT NOT NULL,
    "type" "DistributionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
CREATE TABLE "Attributes" (
    "id" TEXT NOT NULL,
    "poapId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL DEFAULT 'Physical',
    "platform" TEXT,
    "city" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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

-- CreateIndex
CREATE UNIQUE INDEX "ClaimLink_token_key" ON "ClaimLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SecretWord_distributionMethodId_key" ON "SecretWord"("distributionMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "LocationBased_distributionMethodId_key" ON "LocationBased"("distributionMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "Attributes_poapId_key" ON "Attributes"("poapId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_attributesId_key" ON "Organization"("attributesId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_poapId_key" ON "Settings"("poapId");

-- AddForeignKey
ALTER TABLE "DistributionMethod" ADD CONSTRAINT "DistributionMethod_poapId_fkey" FOREIGN KEY ("poapId") REFERENCES "Poap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimLink" ADD CONSTRAINT "ClaimLink_distributionMethodId_fkey" FOREIGN KEY ("distributionMethodId") REFERENCES "DistributionMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretWord" ADD CONSTRAINT "SecretWord_distributionMethodId_fkey" FOREIGN KEY ("distributionMethodId") REFERENCES "DistributionMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationBased" ADD CONSTRAINT "LocationBased_distributionMethodId_fkey" FOREIGN KEY ("distributionMethodId") REFERENCES "DistributionMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attributes" ADD CONSTRAINT "Attributes_poapId_fkey" FOREIGN KEY ("poapId") REFERENCES "Poap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_attributesId_fkey" FOREIGN KEY ("attributesId") REFERENCES "Attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_attributesId_fkey" FOREIGN KEY ("attributesId") REFERENCES "Attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_poapId_fkey" FOREIGN KEY ("poapId") REFERENCES "Poap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
