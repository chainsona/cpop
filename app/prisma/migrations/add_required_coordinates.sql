-- Update existing records with null coordinates to default values (center of the map)
UPDATE "LocationBased"
SET "latitude" = 0.0,
  "longitude" = 0.0
WHERE "latitude" IS NULL
  OR "longitude" IS NULL;
-- Make coordinates required
ALTER TABLE "LocationBased"
ALTER COLUMN "latitude"
SET NOT NULL,
  ALTER COLUMN "longitude"
SET NOT NULL;