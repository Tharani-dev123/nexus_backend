-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('REGULAR', 'ARREARS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL', 'SUSPENDED', 'GRACE_PERIOD');

-- AlterTable
ALTER TABLE "CompanySubscription" ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "PayrollRun" ADD COLUMN     "salaryType" "SalaryType" NOT NULL DEFAULT 'REGULAR';

-- CreateTable
CREATE TABLE "CompanyTaxConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "financialYearStart" INTEGER NOT NULL,
    "proofUploadOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyTaxConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyTaxConfig_companyId_financialYearStart_idx" ON "CompanyTaxConfig"("companyId", "financialYearStart");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTaxConfig_companyId_financialYearStart_key" ON "CompanyTaxConfig"("companyId", "financialYearStart");

-- CreateIndex
CREATE INDEX "CompanySubscription_companyId_status_idx" ON "CompanySubscription"("companyId", "status");

-- AddForeignKey
ALTER TABLE "CompanyTaxConfig" ADD CONSTRAINT "CompanyTaxConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex
DROP INDEX "PayrollRun_companyId_month_year_uploadType_key";

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_companyId_month_year_uploadType_salaryType_key" ON "PayrollRun"("companyId", "month", "year", "uploadType", "salaryType");

