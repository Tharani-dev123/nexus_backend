/*
  Warnings:

  - You are about to drop the `LWP` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LWP" DROP CONSTRAINT "LWP_companyId_fkey";

-- DropForeignKey
ALTER TABLE "LWP" DROP CONSTRAINT "LWP_employeeId_fkey";

-- DropTable
DROP TABLE "LWP";
