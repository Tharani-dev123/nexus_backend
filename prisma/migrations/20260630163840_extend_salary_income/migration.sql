-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PayrollUploadType" ADD VALUE 'LWP';
ALTER TYPE "PayrollUploadType" ADD VALUE 'GRATUITY';

-- AlterTable
ALTER TABLE "TaxDeclaration" ADD COLUMN     "gratuityAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gratuityRemarks" TEXT,
ADD COLUMN     "lwpAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "lwpDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lwpRemarks" TEXT,
ADD COLUMN     "previousEmploymentSalary" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PreviousEmployment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "financialYearStart" INTEGER NOT NULL,
    "financialYearEnd" INTEGER NOT NULL,
    "employerName" TEXT NOT NULL,
    "employerTan" TEXT,
    "employerPan" TEXT,
    "employmentFrom" TIMESTAMP(3) NOT NULL,
    "employmentTo" TIMESTAMP(3) NOT NULL,
    "grossSalary" DECIMAL(15,2) NOT NULL,
    "taxableSalary" DECIMAL(15,2) NOT NULL,
    "professionalTax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tdsDeducted" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherIncome" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "form16Attachment" TEXT,
    "salarySlipAttachment" TEXT,
    "status" "DeclarationStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreviousEmployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PreviousEmployment_employeeId_idx" ON "PreviousEmployment"("employeeId");

-- AddForeignKey
ALTER TABLE "PreviousEmployment" ADD CONSTRAINT "PreviousEmployment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreviousEmployment" ADD CONSTRAINT "PreviousEmployment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
