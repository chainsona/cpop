-- Custom migration to add Deleted to PopStatus enum
ALTER TYPE "PopStatus" ADD VALUE IF NOT EXISTS 'Deleted'; 