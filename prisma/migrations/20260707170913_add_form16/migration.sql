-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "pan" TEXT,
ADD COLUMN     "tan" TEXT;

-- AlterTable
ALTER TABLE "TaxDeclaration" ADD COLUMN     "employeePfAnnual" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Form16" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "generatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Form16_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Form16_companyId_idx" ON "Form16"("companyId");

-- CreateIndex
CREATE INDEX "Form16_employeeId_idx" ON "Form16"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Form16_employeeId_financialYear_key" ON "Form16"("employeeId", "financialYear");

-- AddForeignKey
ALTER TABLE "Form16" ADD CONSTRAINT "Form16_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form16" ADD CONSTRAINT "Form16_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form16" ADD CONSTRAINT "Form16_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
