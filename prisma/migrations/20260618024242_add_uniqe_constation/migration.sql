/*
  Warnings:

  - A unique constraint covering the columns `[companyId,name,deletedAt]` on the table `Department` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Department_companyId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Department_companyId_name_deletedAt_key" ON "Department"("companyId", "name", "deletedAt");
