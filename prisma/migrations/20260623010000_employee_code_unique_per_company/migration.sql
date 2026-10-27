-- The global unique index on Employee.employeeCode prevented the same code from
-- existing in two different companies. Employee codes only need to be unique
-- within a company, which is already enforced by
-- "Employee_companyId_employeeCode_status_key". Drop the redundant global unique.

-- DropIndex
DROP INDEX "Employee_employeeCode_key";
