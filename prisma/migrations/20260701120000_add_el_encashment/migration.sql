-- AddColumn: elEncashmentAmount on TaxDeclaration
-- AddColumn: elEncashmentRemarks on TaxDeclaration
-- CreateTable: ELEncashment
-- No LWP references — LWP was dropped in migration 20260701010556_remove_lwp.

-- AlterTable: TaxDeclaration — add EL Encashment columns (purely additive)
ALTER TABLE "TaxDeclaration" ADD COLUMN "elEncashmentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "TaxDeclaration" ADD COLUMN "elEncashmentRemarks" TEXT;

-- CreateTable: ELEncashment
CREATE TABLE "ELEncashment" (
    "id"                   TEXT         NOT NULL,
    "companyId"            TEXT         NOT NULL,
    "employeeId"           TEXT         NOT NULL,
    "financialYear"        INTEGER      NOT NULL,
    "leaveDaysEncashed"    DECIMAL(6,2) NOT NULL,
    "averageMonthlySalary" DECIMAL(15,2) NOT NULL,
    "yearsOfService"       DECIMAL(4,1) NOT NULL,
    "isGovernmentEmployee" BOOLEAN      NOT NULL DEFAULT false,
    "encashmentAmount"     DECIMAL(15,2) NOT NULL,
    "exemptAmount"         DECIMAL(15,2) NOT NULL,
    "taxableAmount"        DECIMAL(15,2) NOT NULL,
    "remarks"              TEXT,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ELEncashment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: compound unique (companyId, employeeId, financialYear)
CREATE UNIQUE INDEX "ELEncashment_companyId_employeeId_financialYear_key"
    ON "ELEncashment"("companyId", "employeeId", "financialYear");

-- AddForeignKey: ELEncashment → Company
ALTER TABLE "ELEncashment"
    ADD CONSTRAINT "ELEncashment_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ELEncashment → Employee
ALTER TABLE "ELEncashment"
    ADD CONSTRAINT "ELEncashment_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
