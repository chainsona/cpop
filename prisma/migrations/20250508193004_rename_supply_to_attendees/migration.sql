/*
  Warnings:

  - You are about to drop the column `supply` on the `Pop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Pop" DROP COLUMN "supply",
ADD COLUMN     "attendees" INTEGER;
