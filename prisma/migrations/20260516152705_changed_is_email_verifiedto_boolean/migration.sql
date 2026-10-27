/*
  Warnings:

  - You are about to drop the column `emailVerifiedAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerifiedAt",
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
