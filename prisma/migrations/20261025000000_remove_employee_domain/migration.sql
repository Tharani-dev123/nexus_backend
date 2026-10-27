-- Remove employee-linked business data and tables.
DROP TABLE IF EXISTS "AttendanceRegularization" CASCADE;
DROP TABLE IF EXISTS "AttendanceLock" CASCADE;
DROP TABLE IF EXISTS "Attendance" CASCADE;
DROP TABLE IF EXISTS "EmployeeShiftAssignment" CASCADE;
DROP TABLE IF EXISTS "Shift" CASCADE;
DROP TABLE IF EXISTS "Holiday" CASCADE;
DROP TABLE IF EXISTS "LeaveApproval" CASCADE;
DROP TABLE IF EXISTS "LeaveTransaction" CASCADE;
DROP TABLE IF EXISTS "LeaveRequest" CASCADE;
DROP TABLE IF EXISTS "LeaveBalance" CASCADE;
DROP TABLE IF EXISTS "LeavePolicy" CASCADE;
DROP TABLE IF EXISTS "LeaveType" CASCADE;
DROP TABLE IF EXISTS "Form16" CASCADE;
DROP TABLE IF EXISTS "PreviousEmployment" CASCADE;
DROP TABLE IF EXISTS "TaxDeclarationEntry" CASCADE;
DROP TABLE IF EXISTS "TaxEntryFieldValue" CASCADE;
DROP TABLE IF EXISTS "TaxDeclarationItem" CASCADE;
DROP TABLE IF EXISTS "TaxDocument" CASCADE;
DROP TABLE IF EXISTS "TaxDeclaration" CASCADE;
DROP TABLE IF EXISTS "TaxFieldOption" CASCADE;
DROP TABLE IF EXISTS "TaxRegimeConfig" CASCADE;
DROP TABLE IF EXISTS "TaxSectionFieldTemplate" CASCADE;
DROP TABLE IF EXISTS "TaxSectionMaster" CASCADE;
DROP TABLE IF EXISTS "CompanyTaxSectionConfig" CASCADE;
DROP TABLE IF EXISTS "CompanyTaxConfig" CASCADE;
DROP TABLE IF EXISTS "CompanyCustomFieldOption" CASCADE;
DROP TABLE IF EXISTS "CompanyCustomField" CASCADE;
DROP TABLE IF EXISTS "InviteToken" CASCADE;
DROP TABLE IF EXISTS "Employee" CASCADE;

-- Employee-role accounts are no longer valid organization users. Remove their
-- audit and notification rows before deleting the accounts.
DELETE FROM "AuditLog"
WHERE "userId" IN (SELECT "id" FROM "User" WHERE "userRole"::text = 'EMPLOYEE');
DELETE FROM "InAppNotification"
WHERE "userId" IN (SELECT "id" FROM "User" WHERE "userRole"::text = 'EMPLOYEE');
DELETE FROM "User" WHERE "userRole"::text = 'EMPLOYEE';

-- Preserve user invites while renaming their persistence table.
ALTER TABLE IF EXISTS "StaffInvite" RENAME TO "UserInvite";
ALTER INDEX IF EXISTS "StaffInvite_companyId_idx" RENAME TO "UserInvite_companyId_idx";
ALTER TABLE IF EXISTS "UserInvite" RENAME CONSTRAINT "StaffInvite_pkey" TO "UserInvite_pkey";
ALTER TABLE IF EXISTS "UserInvite" RENAME CONSTRAINT "StaffInvite_companyId_fkey" TO "UserInvite_companyId_fkey";

ALTER TABLE IF EXISTS "DocumentMetadata" DROP COLUMN IF EXISTS "employeeId";
ALTER TABLE IF EXISTS "Company"
  DROP COLUMN IF EXISTS "financialYearStartMonth",
  DROP COLUMN IF EXISTS "primaryCountryCode",
  DROP COLUMN IF EXISTS "pan",
  DROP COLUMN IF EXISTS "tan";

-- Recreate UserRole without the employee-only portal role.
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'HR', 'SUPER_ADMIN', 'PAYROLL_MANAGER', 'MANAGER', 'COMPANY_ADMIN', 'FINANCE');
ALTER TABLE "User" ALTER COLUMN "userRole" TYPE "UserRole" USING ("userRole"::text::"UserRole");
ALTER TABLE "UserInvite" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");
DROP TYPE "UserRole_old";

-- Retire removed products and keep only Compliance as a company module.
DELETE FROM "CompanyModule" WHERE "moduleCode"::text <> 'COMPLIANCE';
UPDATE "SubscriptionPlan" SET "isActive" = false
WHERE "code" IN ('TDS', 'TAX_DECLARATION', 'ATTENDANCE', 'LEAVE', 'BIOMETRIC', 'EMPLOYEE_PORTAL');
ALTER TYPE "ProductModule" RENAME TO "ProductModule_old";
CREATE TYPE "ProductModule" AS ENUM ('COMPLIANCE');
ALTER TABLE "CompanyModule" ALTER COLUMN "moduleCode" TYPE "ProductModule"
  USING ("moduleCode"::text::"ProductModule");
DROP TYPE "ProductModule_old";

DROP TYPE IF EXISTS "AttendanceStatus" CASCADE;
DROP TYPE IF EXISTS "AttendanceSource" CASCADE;
DROP TYPE IF EXISTS "RegularizationStatus" CASCADE;
DROP TYPE IF EXISTS "AttendanceLockStatus" CASCADE;
DROP TYPE IF EXISTS "ShiftType" CASCADE;
DROP TYPE IF EXISTS "HolidayType" CASCADE;
DROP TYPE IF EXISTS "HolidayScope" CASCADE;
DROP TYPE IF EXISTS "LeaveCategory" CASCADE;
DROP TYPE IF EXISTS "LeaveStatus" CASCADE;
DROP TYPE IF EXISTS "LeaveAccrualFrequency" CASCADE;
DROP TYPE IF EXISTS "LeaveDuration" CASCADE;
DROP TYPE IF EXISTS "LeaveApprovalStage" CASCADE;
DROP TYPE IF EXISTS "ApprovalAction" CASCADE;
DROP TYPE IF EXISTS "LeaveTxnType" CASCADE;
DROP TYPE IF EXISTS "TaxRegime" CASCADE;
DROP TYPE IF EXISTS "DeclarationStatus" CASCADE;
DROP TYPE IF EXISTS "TaxSection" CASCADE;
DROP TYPE IF EXISTS "TaxFieldType" CASCADE;
DROP TYPE IF EXISTS "TaxSectionCategory" CASCADE;
DROP TYPE IF EXISTS "TaxEntryStatus" CASCADE;
