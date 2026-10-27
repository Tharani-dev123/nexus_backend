/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Employee` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,employeeCode,status]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Employee_companyId_employeeCode_key";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "deletedAt";

-- CreateIndex
CREATE UNIQUE INDEX "Employee_companyId_employeeCode_status_key" ON "Employee"("companyId", "employeeCode", "status");
