-- CreateEnum
CREATE TYPE "TaxFieldType" AS ENUM ('TEXT', 'NUMBER', 'AMOUNT', 'DATE', 'DROPDOWN', 'RADIO', 'CHECKBOX', 'FILE', 'TEXTAREA');

-- CreateEnum
CREATE TYPE "TaxSectionCategory" AS ENUM ('INCOME', 'DEDUCTION', 'EXEMPTION', 'PREVIOUS_EMPLOYER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TaxEntryStatus" AS ENUM ('DRAFT', 'SAVED');

-- AlterTable
ALTER TABLE "TaxDeclaration" ADD COLUMN     "lockReason" TEXT,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "totalDeclaredDeductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalDeclaredIncome" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CompanyCustomField" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sectionId" TEXT,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "TaxFieldType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 99,
    "placeholder" TEXT,
    "helpText" TEXT,
    "validationRules" JSONB,
    "maxAmount" INTEGER,
    "financialYearStart" INTEGER,
    "financialYearEnd" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyCustomFieldOption" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CompanyCustomFieldOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyTaxSectionConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "financialYearStart" INTEGER NOT NULL,
    "financialYearEnd" INTEGER,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "overrideLabel" TEXT,
    "overrideSortOrder" INTEGER,
    "overrideMaxEntries" INTEGER,
    "overrideCap" INTEGER,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyTaxSectionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeclarationEntry" (
    "id" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "entryIndex" INTEGER NOT NULL DEFAULT 1,
    "computedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "TaxEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDeclarationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDocument" (
    "id" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,
    "entryId" TEXT,
    "sectionCode" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Bucket" TEXT,
    "uploadedById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxEntryFieldValue" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "TaxEntryFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxFieldOption" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TaxFieldOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxSectionFieldTemplate" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "TaxFieldType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "validationRules" JSONB,
    "maxAmount" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxSectionFieldTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxSectionMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT,
    "category" "TaxSectionCategory" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "allowedOld" BOOLEAN NOT NULL DEFAULT true,
    "allowedNew" BOOLEAN NOT NULL DEFAULT false,
    "statutoryCap" INTEGER,
    "capConfigKey" TEXT,
    "groupInto80C" BOOLEAN NOT NULL DEFAULT false,
    "computedSeparately" BOOLEAN NOT NULL DEFAULT false,
    "multiEntry" BOOLEAN NOT NULL DEFAULT false,
    "maxEntries" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxSectionMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyCustomField_companyId_sectionId_idx" ON "CompanyCustomField"("companyId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyCustomField_companyId_fieldKey_key" ON "CompanyCustomField"("companyId", "fieldKey");

-- CreateIndex
CREATE INDEX "CompanyCustomFieldOption_fieldId_idx" ON "CompanyCustomFieldOption"("fieldId");

-- CreateIndex
CREATE INDEX "CompanyTaxSectionConfig_companyId_financialYearStart_idx" ON "CompanyTaxSectionConfig"("companyId", "financialYearStart");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTaxSectionConfig_companyId_sectionId_financialYearSt_key" ON "CompanyTaxSectionConfig"("companyId", "sectionId", "financialYearStart");

-- CreateIndex
CREATE INDEX "TaxDeclarationEntry_declarationId_sectionId_idx" ON "TaxDeclarationEntry"("declarationId", "sectionId");

-- CreateIndex
CREATE INDEX "TaxDeclarationEntry_declarationId_idx" ON "TaxDeclarationEntry"("declarationId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxDeclarationEntry_declarationId_sectionId_entryIndex_key" ON "TaxDeclarationEntry"("declarationId", "sectionId", "entryIndex");

-- CreateIndex
CREATE INDEX "TaxDocument_declarationId_idx" ON "TaxDocument"("declarationId");

-- CreateIndex
CREATE INDEX "TaxDocument_declarationId_sectionCode_idx" ON "TaxDocument"("declarationId", "sectionCode");

-- CreateIndex
CREATE INDEX "TaxDocument_entryId_idx" ON "TaxDocument"("entryId");

-- CreateIndex
CREATE INDEX "TaxEntryFieldValue_entryId_idx" ON "TaxEntryFieldValue"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxEntryFieldValue_entryId_fieldKey_key" ON "TaxEntryFieldValue"("entryId", "fieldKey");

-- CreateIndex
CREATE INDEX "TaxFieldOption_fieldId_idx" ON "TaxFieldOption"("fieldId");

-- CreateIndex
CREATE INDEX "TaxSectionFieldTemplate_sectionId_sortOrder_idx" ON "TaxSectionFieldTemplate"("sectionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TaxSectionFieldTemplate_sectionId_fieldKey_key" ON "TaxSectionFieldTemplate"("sectionId", "fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "TaxSectionMaster_code_key" ON "TaxSectionMaster"("code");

-- CreateIndex
CREATE INDEX "TaxSectionMaster_category_idx" ON "TaxSectionMaster"("category");

-- CreateIndex
CREATE INDEX "TaxSectionMaster_sortOrder_idx" ON "TaxSectionMaster"("sortOrder");

-- AddForeignKey
ALTER TABLE "CompanyCustomField" ADD CONSTRAINT "CompanyCustomField_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCustomField" ADD CONSTRAINT "CompanyCustomField_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "TaxSectionMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCustomFieldOption" ADD CONSTRAINT "CompanyCustomFieldOption_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CompanyCustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTaxSectionConfig" ADD CONSTRAINT "CompanyTaxSectionConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTaxSectionConfig" ADD CONSTRAINT "CompanyTaxSectionConfig_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "TaxSectionMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeclarationEntry" ADD CONSTRAINT "TaxDeclarationEntry_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "TaxDeclaration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeclarationEntry" ADD CONSTRAINT "TaxDeclarationEntry_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "TaxSectionMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDocument" ADD CONSTRAINT "TaxDocument_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "TaxDeclaration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDocument" ADD CONSTRAINT "TaxDocument_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "TaxDeclarationEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxEntryFieldValue" ADD CONSTRAINT "TaxEntryFieldValue_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "TaxDeclarationEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxFieldOption" ADD CONSTRAINT "TaxFieldOption_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "TaxSectionFieldTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxSectionFieldTemplate" ADD CONSTRAINT "TaxSectionFieldTemplate_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "TaxSectionMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
