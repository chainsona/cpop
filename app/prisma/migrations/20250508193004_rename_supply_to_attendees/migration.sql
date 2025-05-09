/*
  Warnings:

  - You are about to drop the column `supply` on the `Poap` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Poap" DROP COLUMN "supply",
ADD COLUMN     "attendees" INTEGER;
