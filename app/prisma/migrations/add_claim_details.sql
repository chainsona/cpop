-- Add claim details to ClaimLink table
ALTER TABLE "ClaimLink" ADD COLUMN IF NOT EXISTS "claimedByWallet" TEXT;
ALTER TABLE "ClaimLink" ADD COLUMN IF NOT EXISTS "transactionSignature" TEXT; 