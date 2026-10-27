/*
  Warnings:

  - You are about to drop the column `replacedByTokenId` on the `RefreshToken` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_replacedByTokenId_fkey";

-- DropIndex
DROP INDEX "RefreshToken_replacedByTokenId_key";

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "replacedByTokenId";
