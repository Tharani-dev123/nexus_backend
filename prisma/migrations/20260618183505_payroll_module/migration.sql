/*
  Warnings:

  - You are about to drop the column `arrear` on the `PayrollEntry` table. All the data in the column will be lost.
  - You are about to drop the column `basic` on the `PayrollEntry` table. All the data in the column will be lost.
  - You are about to drop the column `bonus` on the `PayrollEntry` table. All the data in the column will be lost.
  - You are about to drop the column `communicationAllowance` on the `PayrollEntry` table. All the data in the column will be lost.
  - You are about to drop the column `conveyanceAllowance` on the `PayrollEntry` table. All the data in the column will be lost.
  - You are about to drop the column `hra` on the `PayrollEntry` table. All the data in the column will be lost.
  - You are about to drop the column `medicalAllowance` on the `PayrollEntry` table. All the data in the column will be lost.
  - You are about to drop the column `otherAllowance` on the `PayrollEntry` table. All the data in the column will be lost.
  - You are about to drop the column `siteAllowance` on the `PayrollEntry` table. All the data in the column will be lost.
  - You are about to drop the column `specialAllowance` on the `PayrollEntry` table. All the data in the column will be lost.
  - You are about to drop the column `basic` on the `SalaryStructure` table. All the data in the column will be lost.
  - You are about to drop the column `communicationAllowance` on the `SalaryStructure` table. All the data in the column will be lost.
  - You are about to drop the column `conveyance` on the `SalaryStructure` table. All the data in the column will be lost.
  - You are about to drop the column `hra` on the `SalaryStructure` table. All the data in the column will be lost.
  - You are about to drop the column `medicalAllowance` on the `SalaryStructure` table. All the data in the column will be lost.
  - You are about to drop the column `otherAllowance` on the `SalaryStructure` table. All the data in the column will be lost.
  - You are about to drop the column `specialAllowance` on the `SalaryStructure` table. All the data in the column will be lost.
  - Made the column `annualCTC` on table `SalaryStructure` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PayrollComponentType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "ComponentCalculationType" AS ENUM ('FIXED', 'PERCENTAGE_OF_CTC', 'PERCENTAGE_OF_BASIC', 'PERCENTAGE_OF_GROSS', 'BALANCING', 'FORMULA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaxSection" ADD VALUE 'SECTION_80CCD_1B';
ALTER TYPE "TaxSection" ADD VALUE 'SECTION_80DD';
ALTER TYPE "TaxSection" ADD VALUE 'SECTION_80DDB';
ALTER TYPE "TaxSection" ADD VALUE 'SECTION_80E';
ALTER TYPE "TaxSection" ADD VALUE 'SECTION_80G';

-- AlterTable
ALTER TABLE "PayrollEntry" DROP COLUMN "arrear",
DROP COLUMN "basic",
DROP COLUMN "bonus",
DROP COLUMN "communicationAllowance",
DROP COLUMN "conveyanceAllowance",
DROP COLUMN "hra",
DROP COLUMN "medicalAllowance",
DROP COLUMN "otherAllowance",
DROP COLUMN "siteAllowance",
DROP COLUMN "specialAllowance";

-- AlterTable
ALTER TABLE "SalaryStructure" DROP COLUMN "basic",
DROP COLUMN "communicationAllowance",
DROP COLUMN "conveyance",
DROP COLUMN "hra",
DROP COLUMN "medicalAllowance",
DROP COLUMN "otherAllowance",
DROP COLUMN "specialAllowance",
ALTER COLUMN "annualCTC" SET NOT NULL;

-- CreateTable
CREATE TABLE "SalaryStructureComponent" (
    "id" TEXT NOT NULL,
    "salaryStructureId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "calculationType" "ComponentCalculationType" NOT NULL,
    "value" DECIMAL(15,4),
    "formula" TEXT,
    "computedAnnualAmount" DECIMAL(15,2),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructureComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollComponent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PayrollComponentType" NOT NULL DEFAULT 'EARNING',
    "defaultCalculationType" "ComponentCalculationType" NOT NULL DEFAULT 'FIXED',
    "isTaxable" BOOLEAN NOT NULL DEFAULT true,
    "isStatutory" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEntryComponent" (
    "id" TEXT NOT NULL,
    "payrollEntryId" TEXT NOT NULL,
    "componentId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PayrollComponentType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollEntryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalaryStructureComponent_salaryStructureId_idx" ON "SalaryStructureComponent"("salaryStructureId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructureComponent_salaryStructureId_componentId_key" ON "SalaryStructureComponent"("salaryStructureId", "componentId");

-- CreateIndex
CREATE INDEX "PayrollComponent_companyId_idx" ON "PayrollComponent"("companyId");

-- CreateIndex
CREATE INDEX "PayrollComponent_companyId_isActive_idx" ON "PayrollComponent"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollComponent_companyId_code_key" ON "PayrollComponent"("companyId", "code");

-- CreateIndex
CREATE INDEX "PayrollEntryComponent_payrollEntryId_idx" ON "PayrollEntryComponent"("payrollEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEntryComponent_payrollEntryId_code_key" ON "PayrollEntryComponent"("payrollEntryId", "code");

-- AddForeignKey
ALTER TABLE "SalaryStructureComponent" ADD CONSTRAINT "SalaryStructureComponent_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "SalaryStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureComponent" ADD CONSTRAINT "SalaryStructureComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "PayrollComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollComponent" ADD CONSTRAINT "PayrollComponent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntryComponent" ADD CONSTRAINT "PayrollEntryComponent_payrollEntryId_fkey" FOREIGN KEY ("payrollEntryId") REFERENCES "PayrollEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntryComponent" ADD CONSTRAINT "PayrollEntryComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "PayrollComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
