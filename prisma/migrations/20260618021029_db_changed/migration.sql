/*
  Warnings:

  - Added the required column `userRole` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PAYSLIP', 'FORM16', 'DECLARATION_PDF');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PayslipEmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'PROCESSING', 'PROCESSED', 'FINALISED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayrollUploadType" AS ENUM ('SALARY', 'INCENTIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('OLD', 'NEW');

-- CreateEnum
CREATE TYPE "DeclarationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TaxSection" AS ENUM ('SECTION_80C', 'SECTION_80CCD', 'SECTION_80D', 'HRA', 'HOME_LOAN', 'NPS', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'HR', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "financialYearStartMonth" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "primaryCountryCode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userRole" "UserRole" NOT NULL;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "companyId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "panNumber" TEXT,
    "panDocKey" TEXT,
    "aadhaarNo" TEXT,
    "designation" TEXT,
    "departmentId" TEXT,
    "joinDate" TIMESTAMP(3),
    "uanNumber" TEXT,
    "pfNumber" TEXT,
    "esiNumber" TEXT,
    "bankAccountNumber" TEXT,
    "bankName" TEXT,
    "ifscCode" TEXT,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteToken" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "basic" DECIMAL(15,2) NOT NULL,
    "hra" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "conveyance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "medicalAllowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "specialAllowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "communicationAllowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherAllowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "annualCTC" DECIMAL(15,2),
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "s3Key" TEXT NOT NULL,
    "periodLabel" TEXT,
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEntry" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "daysInMonth" INTEGER NOT NULL,
    "effectiveWorkdays" INTEGER NOT NULL,
    "presentDays" DECIMAL(5,2) NOT NULL,
    "lopDays" DECIMAL(5,2) NOT NULL,
    "paidDays" DECIMAL(5,2) NOT NULL,
    "basic" DECIMAL(15,2) NOT NULL,
    "hra" DECIMAL(15,2) NOT NULL,
    "conveyanceAllowance" DECIMAL(15,2) NOT NULL,
    "medicalAllowance" DECIMAL(15,2) NOT NULL,
    "specialAllowance" DECIMAL(15,2) NOT NULL,
    "communicationAllowance" DECIMAL(15,2) NOT NULL,
    "otherAllowance" DECIMAL(15,2) NOT NULL,
    "siteAllowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bonus" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "arrear" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "annualCTC" DECIMAL(15,2),
    "grossSalary" DECIMAL(15,2) NOT NULL,
    "pf" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "esi" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "employerPf" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "employerEsi" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "incomeTax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "professionalTax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherDeduction" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(15,2) NOT NULL,
    "netPay" DECIMAL(15,2) NOT NULL,
    "payslipId" TEXT,
    "sourceRow" INTEGER,
    "remarks" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "sourceFileKey" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadType" "PayrollUploadType" NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'PROCESSED',
    "processedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "payrollEntryId" TEXT NOT NULL,
    "emailStatus" "PayslipEmailStatus" NOT NULL DEFAULT 'PENDING',
    "s3Key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "emailedAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollSetting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pfEmployeePercent" DECIMAL(5,2) NOT NULL,
    "pfEmployerPercent" DECIMAL(5,2) NOT NULL,
    "pfSalaryCeiling" DECIMAL(15,2) NOT NULL,
    "esiEmployeePercent" DECIMAL(5,2) NOT NULL,
    "esiEmployerPercent" DECIMAL(5,2) NOT NULL,
    "esiSalaryCeiling" DECIMAL(15,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pfEnabled" BOOLEAN NOT NULL DEFAULT true,
    "esiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "professionalTaxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "ptState" TEXT,
    "professionalTaxAmount" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeclaration" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "financialYearStart" INTEGER NOT NULL,
    "financialYearEnd" INTEGER NOT NULL,
    "regime" "TaxRegime" NOT NULL DEFAULT 'OLD',
    "status" "DeclarationStatus" NOT NULL DEFAULT 'DRAFT',
    "residenceLocation" TEXT,
    "basicAnnual" DECIMAL(15,2) NOT NULL,
    "hraAnnual" DECIMAL(15,2) NOT NULL,
    "conveyanceAnnual" DECIMAL(15,2) NOT NULL,
    "medicalAnnual" DECIMAL(15,2) NOT NULL,
    "specialAllowanceAnnual" DECIMAL(15,2) NOT NULL,
    "communicationAnnual" DECIMAL(15,2) NOT NULL,
    "otherAllowanceAnnual" DECIMAL(15,2) NOT NULL,
    "bonusAnnual" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grandTotalSalary" DECIMAL(15,2) NOT NULL,
    "hraExemption" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "standardDeduction" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "professionalTaxAnnual" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "housingLoanInterest" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherIncome" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxableIncome" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxBeforeRebate" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "rebate87A" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "surcharge" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cess" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalTaxPayable" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tdsDeducted" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balanceTaxPayable" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "monthlyRent" DECIMAL(15,2),
    "landlordName" TEXT,
    "landlordPan" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "sourceFileKey" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeclarationItem" (
    "id" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,
    "section" "TaxSection" NOT NULL,
    "description" TEXT,
    "referenceNo" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "proofDocKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxDeclarationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRegimeConfig" (
    "id" TEXT NOT NULL,
    "slabs" JSONB NOT NULL,
    "surchargeSlabs" JSONB NOT NULL,
    "cessRate" DECIMAL(6,4) NOT NULL,
    "financialYearStart" INTEGER NOT NULL,
    "financialYearEnd" INTEGER NOT NULL,
    "regime" "TaxRegime" NOT NULL,
    "standardDeduction" DECIMAL(15,2) NOT NULL,
    "section80CLimit" DECIMAL(15,2) NOT NULL,
    "section80CCD1BLimit" DECIMAL(15,2) NOT NULL,
    "rebate87ALimit" DECIMAL(15,2) NOT NULL,
    "rebate87AThreshold" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxRegimeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_companyId_name_key" ON "Department"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_employeeCode_idx" ON "Employee"("employeeCode");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_companyId_employeeCode_key" ON "Employee"("companyId", "employeeCode");

-- CreateIndex
CREATE INDEX "SalaryStructure_employeeId_idx" ON "SalaryStructure"("employeeId");

-- CreateIndex
CREATE INDEX "SalaryStructure_employeeId_isActive_idx" ON "SalaryStructure"("employeeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEntry_payrollRunId_employeeId_key" ON "PayrollEntry"("payrollRunId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_companyId_month_year_uploadType_key" ON "PayrollRun"("companyId", "month", "year", "uploadType");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_payrollEntryId_key" ON "Payslip"("payrollEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollSetting_companyId_key" ON "PayrollSetting"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxDeclaration_employeeId_financialYearStart_financialYearE_key" ON "TaxDeclaration"("employeeId", "financialYearStart", "financialYearEnd");

-- CreateIndex
CREATE INDEX "TaxDeclarationItem_declarationId_idx" ON "TaxDeclarationItem"("declarationId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRegimeConfig_financialYearStart_financialYearEnd_regime_key" ON "TaxRegimeConfig"("financialYearStart", "financialYearEnd", "regime");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrollEntryId_fkey" FOREIGN KEY ("payrollEntryId") REFERENCES "PayrollEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSetting" ADD CONSTRAINT "PayrollSetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeclaration" ADD CONSTRAINT "TaxDeclaration_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeclaration" ADD CONSTRAINT "TaxDeclaration_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeclarationItem" ADD CONSTRAINT "TaxDeclarationItem_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "TaxDeclaration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
