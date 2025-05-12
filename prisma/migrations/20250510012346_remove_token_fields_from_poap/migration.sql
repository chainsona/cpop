-- Remove tokenMinted and tokenSupply fields from Pop model
ALTER TABLE "Pop" DROP COLUMN IF EXISTS "tokenMinted";
ALTER TABLE "Pop" DROP COLUMN IF EXISTS "tokenSupply";
