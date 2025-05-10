-- Remove tokenMinted and tokenSupply fields from Poap model
ALTER TABLE "Poap" DROP COLUMN IF EXISTS "tokenMinted";
ALTER TABLE "Poap" DROP COLUMN IF EXISTS "tokenSupply";
