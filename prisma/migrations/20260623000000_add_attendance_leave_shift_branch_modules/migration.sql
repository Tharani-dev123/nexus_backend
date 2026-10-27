-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY', 'WEEKLY_OFF', 'WORK_FROM_HOME', 'ON_DUTY', 'LATE_ENTRY', 'EARLY_EXIT');

-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('MANUAL', 'BULK_UPLOAD', 'BIOMETRIC', 'SELF_SERVICE', 'REGULARIZATION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RegularizationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceLockStatus" AS ENUM ('OPEN', 'LOCKED');

-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('NATIONAL', 'REGIONAL', 'COMPANY', 'OPTIONAL', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "HolidayScope" AS ENUM ('COMPANY', 'BRANCH');

-- CreateEnum
CREATE TYPE "LeaveCategory" AS ENUM ('CASUAL', 'SICK', 'EARNED', 'PRIVILEGE', 'COMP_OFF', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'UNPAID');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveAccrualFrequency" AS ENUM ('MONTHLY', 'YEARLY', 'NONE');

-- CreateEnum
CREATE TYPE "LeaveDuration" AS ENUM ('FULL_DAY', 'FIRST_HALF', 'SECOND_HALF');

-- CreateEnum
CREATE TYPE "LeaveApprovalStage" AS ENUM ('MANAGER', 'HR');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'FORWARDED');

-- CreateEnum
CREATE TYPE "LeaveTxnType" AS ENUM ('ACCRUAL', 'ALLOCATION', 'CONSUMPTION', 'ENCASHMENT', 'CARRY_FORWARD', 'LAPSE', 'ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('GENERAL', 'MORNING', 'EVENING', 'NIGHT', 'FLEXIBLE');

-- AlterEnum
ALTER TYPE "PayrollComponentType" ADD VALUE 'EMPLOYER_CONTRIBUTION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'PAYROLL_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'MANAGER';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "noticePeriodEndDate" TIMESTAMP(3),
ADD COLUMN     "probationEndDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SalaryStructure" ADD COLUMN     "revisionNote" TEXT,
ADD COLUMN     "revisionNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "source" "AttendanceSource" NOT NULL DEFAULT 'MANUAL',
    "shiftId" TEXT,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "workedMinutes" INTEGER NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "earlyExitMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "isEarlyExit" BOOLEAN NOT NULL DEFAULT false,
    "dayValue" DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "leaveRequestId" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "payrollRunId" TEXT,
    "remarks" TEXT,
    "markedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceLock" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "AttendanceLockStatus" NOT NULL DEFAULT 'LOCKED',
    "lockedById" TEXT,
    "lockedAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRegularization" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "attendanceId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "requestedStatus" "AttendanceStatus" NOT NULL,
    "requestedCheckIn" TIMESTAMP(3),
    "requestedCheckOut" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" "RegularizationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRegularization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "addressLine" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "pinCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "HolidayType" NOT NULL DEFAULT 'COMPANY',
    "scope" "HolidayScope" NOT NULL DEFAULT 'COMPANY',
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApproval" (
    "id" TEXT NOT NULL,
    "leaveRequestId" TEXT NOT NULL,
    "stage" "LeaveApprovalStage" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "approverId" TEXT,
    "action" "ApprovalAction" NOT NULL DEFAULT 'SUBMITTED',
    "note" TEXT,
    "actedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveBalance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "opening" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "accrued" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "carried" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "used" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "encashed" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "lapsed" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "adjusted" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePolicy" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "accrualFrequency" "LeaveAccrualFrequency" NOT NULL DEFAULT 'MONTHLY',
    "accrualRate" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "annualQuota" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "maxBalance" DECIMAL(6,2),
    "carryForward" BOOLEAN NOT NULL DEFAULT false,
    "carryForwardLimit" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "expiryMonths" INTEGER NOT NULL DEFAULT 0,
    "allowEncashment" BOOLEAN NOT NULL DEFAULT false,
    "encashmentLimit" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "allowedDuringProbation" BOOLEAN NOT NULL DEFAULT false,
    "allowedDuringNoticePeriod" BOOLEAN NOT NULL DEFAULT true,
    "minNoticeDays" INTEGER NOT NULL DEFAULT 0,
    "minDaysPerRequest" DECIMAL(6,2),
    "maxDaysPerRequest" DECIMAL(6,2),
    "sandwichPolicy" BOOLEAN NOT NULL DEFAULT false,
    "includeHolidays" BOOLEAN NOT NULL DEFAULT false,
    "includeWeekends" BOOLEAN NOT NULL DEFAULT false,
    "requiresManagerApproval" BOOLEAN NOT NULL DEFAULT true,
    "requiresHrApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startHalf" "LeaveDuration" NOT NULL DEFAULT 'FULL_DAY',
    "endHalf" "LeaveDuration" NOT NULL DEFAULT 'FULL_DAY',
    "totalDays" DECIMAL(6,2) NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "currentStage" "LeaveApprovalStage",
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveTransaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "leaveBalanceId" TEXT NOT NULL,
    "type" "LeaveTxnType" NOT NULL,
    "amount" DECIMAL(7,2) NOT NULL,
    "balanceAfter" DECIMAL(7,2) NOT NULL,
    "leaveRequestId" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "LeaveCategory" NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "colorHex" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructureTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "referenceAnnualCTC" DECIMAL(15,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SalaryStructureTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructureTemplateComponent" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "calculationType" "ComponentCalculationType" NOT NULL,
    "value" DECIMAL(15,4),
    "formula" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructureTemplateComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeShiftAssignment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ShiftType" NOT NULL DEFAULT 'GENERAL',
    "startTimeMin" INTEGER,
    "endTimeMin" INTEGER,
    "graceMinutes" INTEGER NOT NULL DEFAULT 0,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "fullDayMinutes" INTEGER NOT NULL DEFAULT 480,
    "halfDayMinutes" INTEGER NOT NULL DEFAULT 240,
    "weeklyOffPattern" TEXT NOT NULL DEFAULT '1000000',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attendance_companyId_date_idx" ON "Attendance"("companyId", "date");

-- CreateIndex
CREATE INDEX "Attendance_employeeId_date_idx" ON "Attendance"("employeeId", "date");

-- CreateIndex
CREATE INDEX "Attendance_companyId_branchId_date_idx" ON "Attendance"("companyId", "branchId", "date");

-- CreateIndex
CREATE INDEX "Attendance_companyId_status_idx" ON "Attendance"("companyId", "status");

-- CreateIndex
CREATE INDEX "Attendance_isLocked_idx" ON "Attendance"("isLocked");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON "Attendance"("employeeId", "date");

-- CreateIndex
CREATE INDEX "AttendanceLock_companyId_year_month_idx" ON "AttendanceLock"("companyId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceLock_companyId_branchId_month_year_key" ON "AttendanceLock"("companyId", "branchId", "month", "year");

-- CreateIndex
CREATE INDEX "AttendanceRegularization_companyId_status_idx" ON "AttendanceRegularization"("companyId", "status");

-- CreateIndex
CREATE INDEX "AttendanceRegularization_employeeId_date_idx" ON "AttendanceRegularization"("employeeId", "date");

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE INDEX "Branch_companyId_isActive_idx" ON "Branch"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_companyId_code_deletedAt_key" ON "Branch"("companyId", "code", "deletedAt");

-- CreateIndex
CREATE INDEX "Holiday_companyId_year_idx" ON "Holiday"("companyId", "year");

-- CreateIndex
CREATE INDEX "Holiday_companyId_branchId_year_idx" ON "Holiday"("companyId", "branchId", "year");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_companyId_branchId_date_name_deletedAt_key" ON "Holiday"("companyId", "branchId", "date", "name", "deletedAt");

-- CreateIndex
CREATE INDEX "LeaveApproval_leaveRequestId_idx" ON "LeaveApproval"("leaveRequestId");

-- CreateIndex
CREATE INDEX "LeaveBalance_companyId_year_idx" ON "LeaveBalance"("companyId", "year");

-- CreateIndex
CREATE INDEX "LeaveBalance_employeeId_idx" ON "LeaveBalance"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_employeeId_leaveTypeId_year_key" ON "LeaveBalance"("employeeId", "leaveTypeId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePolicy_leaveTypeId_key" ON "LeavePolicy"("leaveTypeId");

-- CreateIndex
CREATE INDEX "LeavePolicy_companyId_idx" ON "LeavePolicy"("companyId");

-- CreateIndex
CREATE INDEX "LeaveRequest_companyId_status_idx" ON "LeaveRequest"("companyId", "status");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeId_status_idx" ON "LeaveRequest"("employeeId", "status");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeId_startDate_endDate_idx" ON "LeaveRequest"("employeeId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "LeaveRequest_leaveTypeId_idx" ON "LeaveRequest"("leaveTypeId");

-- CreateIndex
CREATE INDEX "LeaveTransaction_leaveBalanceId_idx" ON "LeaveTransaction"("leaveBalanceId");

-- CreateIndex
CREATE INDEX "LeaveTransaction_companyId_createdAt_idx" ON "LeaveTransaction"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "LeaveTransaction_leaveRequestId_idx" ON "LeaveTransaction"("leaveRequestId");

-- CreateIndex
CREATE INDEX "LeaveType_companyId_idx" ON "LeaveType"("companyId");

-- CreateIndex
CREATE INDEX "LeaveType_companyId_isActive_idx" ON "LeaveType"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_companyId_code_deletedAt_key" ON "LeaveType"("companyId", "code", "deletedAt");

-- CreateIndex
CREATE INDEX "SalaryStructureTemplate_companyId_idx" ON "SalaryStructureTemplate"("companyId");

-- CreateIndex
CREATE INDEX "SalaryStructureTemplate_companyId_isActive_idx" ON "SalaryStructureTemplate"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructureTemplate_companyId_code_deletedAt_key" ON "SalaryStructureTemplate"("companyId", "code", "deletedAt");

-- CreateIndex
CREATE INDEX "SalaryStructureTemplateComponent_templateId_idx" ON "SalaryStructureTemplateComponent"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructureTemplateComponent_templateId_componentId_key" ON "SalaryStructureTemplateComponent"("templateId", "componentId");

-- CreateIndex
CREATE INDEX "EmployeeShiftAssignment_companyId_idx" ON "EmployeeShiftAssignment"("companyId");

-- CreateIndex
CREATE INDEX "EmployeeShiftAssignment_employeeId_isActive_idx" ON "EmployeeShiftAssignment"("employeeId", "isActive");

-- CreateIndex
CREATE INDEX "EmployeeShiftAssignment_employeeId_effectiveFrom_idx" ON "EmployeeShiftAssignment"("employeeId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "Shift_companyId_idx" ON "Shift"("companyId");

-- CreateIndex
CREATE INDEX "Shift_companyId_isActive_idx" ON "Shift"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_companyId_code_deletedAt_key" ON "Shift"("companyId", "code", "deletedAt");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "Employee_branchId_idx" ON "Employee"("branchId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceLock" ADD CONSTRAINT "AttendanceLock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRegularization" ADD CONSTRAINT "AttendanceRegularization_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRegularization" ADD CONSTRAINT "AttendanceRegularization_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApproval" ADD CONSTRAINT "LeaveApproval_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicy" ADD CONSTRAINT "LeavePolicy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicy" ADD CONSTRAINT "LeavePolicy_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveTransaction" ADD CONSTRAINT "LeaveTransaction_leaveBalanceId_fkey" FOREIGN KEY ("leaveBalanceId") REFERENCES "LeaveBalance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveType" ADD CONSTRAINT "LeaveType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureTemplate" ADD CONSTRAINT "SalaryStructureTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureTemplateComponent" ADD CONSTRAINT "SalaryStructureTemplateComponent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SalaryStructureTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureTemplateComponent" ADD CONSTRAINT "SalaryStructureTemplateComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "PayrollComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShiftAssignment" ADD CONSTRAINT "EmployeeShiftAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShiftAssignment" ADD CONSTRAINT "EmployeeShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
