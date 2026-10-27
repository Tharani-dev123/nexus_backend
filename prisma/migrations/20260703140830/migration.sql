/*
  Warnings:

  - The values [LWP] on the enum `PayrollUploadType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `lwpAmount` on the `TaxDeclaration` table. All the data in the column will be lost.
  - You are about to drop the column `lwpDays` on the `TaxDeclaration` table. All the data in the column will be lost.
  - You are about to drop the column `lwpRemarks` on the `TaxDeclaration` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PayrollUploadType_new" AS ENUM ('SALARY', 'INCENTIVE', 'OTHER', 'GRATUITY');
ALTER TABLE "PayrollRun" ALTER COLUMN "uploadType" TYPE "PayrollUploadType_new" USING ("uploadType"::text::"PayrollUploadType_new");
ALTER TYPE "PayrollUploadType" RENAME TO "PayrollUploadType_old";
ALTER TYPE "PayrollUploadType_new" RENAME TO "PayrollUploadType";
DROP TYPE "public"."PayrollUploadType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'COMPANY_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'FINANCE';

-- AlterTable
ALTER TABLE "TaxDeclaration" DROP COLUMN "lwpAmount",
DROP COLUMN "lwpDays",
DROP COLUMN "lwpRemarks";

-- CreateTable
CREATE TABLE "DocumentMetadata" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "employeeId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationQueue" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "errorLog" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "payroll" JSONB,
    "attendance" JSONB,
    "tax" JSONB,
    "email" JSONB,
    "notification" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "approverId" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "actedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentMetadata_companyId_idx" ON "DocumentMetadata"("companyId");

-- CreateIndex
CREATE INDEX "DocumentMetadata_employeeId_idx" ON "DocumentMetadata"("employeeId");

-- CreateIndex
CREATE INDEX "DocumentMetadata_category_idx" ON "DocumentMetadata"("category");

-- CreateIndex
CREATE INDEX "InAppNotification_userId_isRead_idx" ON "InAppNotification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "NotificationQueue_status_scheduledAt_idx" ON "NotificationQueue"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_companyId_key" ON "SystemSetting"("companyId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_module_entityId_idx" ON "WorkflowInstance"("module", "entityId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_companyId_idx" ON "WorkflowInstance"("companyId");

-- CreateIndex
CREATE INDEX "WorkflowStep_instanceId_idx" ON "WorkflowStep"("instanceId");

-- CreateIndex
CREATE INDEX "PayrollEntry_employeeId_idx" ON "PayrollEntry"("employeeId");

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
