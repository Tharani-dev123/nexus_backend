-- Migration: add_salary_arrear_and_arrears_annual
-- Creates the SalaryArrear table (independent arrears ledger per employee per payroll month)
-- and adds arrearsAnnual to TaxDeclaration so it feeds into grandTotalSalary / tax engine.

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. TaxDeclaration: add arrearsAnnual column
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE "TaxDeclaration"
  ADD COLUMN "arrearsAnnual" DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. SalaryArrear table
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE "SalaryArrear" (
  "id"           TEXT NOT NULL,
  "companyId"    TEXT NOT NULL,
  "year"         INTEGER NOT NULL,
  "month"        INTEGER NOT NULL,
  "employeeId"   TEXT NOT NULL,
  "amount"       DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "remarks"      TEXT,
  "uploadedById" TEXT NOT NULL,
  "uploadedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SalaryArrear_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one arrear record per employee per payroll month per company.
ALTER TABLE "SalaryArrear"
  ADD CONSTRAINT "SalaryArrear_companyId_year_month_employeeId_key"
  UNIQUE ("companyId", "year", "month", "employeeId");

-- Indexes for common query patterns.
CREATE INDEX "SalaryArrear_companyId_year_month_idx"
  ON "SalaryArrear" ("companyId", "year", "month");

CREATE INDEX "SalaryArrear_employeeId_idx"
  ON "SalaryArrear" ("employeeId");

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Foreign keys
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE "SalaryArrear"
  ADD CONSTRAINT "SalaryArrear_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company" ("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SalaryArrear"
  ADD CONSTRAINT "SalaryArrear_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SalaryArrear"
  ADD CONSTRAINT "SalaryArrear_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User" ("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
