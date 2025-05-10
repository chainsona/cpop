-- AlterTable
ALTER TABLE "Poap" ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "tokenMinted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tokenSupply" INTEGER NOT NULL DEFAULT 0;

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
CREATE TABLE "PoapToken" (
    "id" TEXT NOT NULL,
    "poapId" TEXT NOT NULL,
    "mintAddress" TEXT NOT NULL,
    "supply" INTEGER NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoapToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "PoapToken_mintAddress_key" ON "PoapToken"("mintAddress");

-- AddForeignKey
ALTER TABLE "Poap" ADD CONSTRAINT "Poap_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoapToken" ADD CONSTRAINT "PoapToken_poapId_fkey" FOREIGN KEY ("poapId") REFERENCES "Poap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
