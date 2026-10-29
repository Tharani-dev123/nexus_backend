ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'STUDENT';
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN "studentSelfRegistrationEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "StudentStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'ARCHIVED', 'REJECTED');
CREATE TYPE "StudentDepartmentStatus" AS ENUM ('ACTIVE', 'ENDED');
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'PASSWORD_RESET', 'EMAIL_VERIFICATION', 'STUDENT_SETUP');

CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "phone" TEXT,
    "address" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "emergencyContact" TEXT,
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectionReason" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentDepartment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "status" "StudentDepartmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentDepartment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentStaffAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "departmentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentStaffAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentActivity" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "sourceModule" TEXT,
    "sourceRecordId" TEXT,
    CONSTRAINT "StudentActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentAdmissionCode" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "allowsSelfRegistration" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentAdmissionCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "userId" TEXT,
    "purpose" "OtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OtpRateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRequestAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OtpRateLimit_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");
CREATE UNIQUE INDEX "StudentProfile_id_companyId_branchId_key" ON "StudentProfile"("id", "companyId", "branchId");
CREATE UNIQUE INDEX "StudentProfile_companyId_branchId_admissionNumber_key" ON "StudentProfile"("companyId", "branchId", "admissionNumber");
CREATE INDEX "StudentProfile_companyId_status_createdAt_idx" ON "StudentProfile"("companyId", "status", "createdAt");
CREATE INDEX "StudentProfile_branchId_status_idx" ON "StudentProfile"("branchId", "status");
CREATE INDEX "StudentDepartment_studentId_status_idx" ON "StudentDepartment"("studentId", "status");
CREATE INDEX "StudentDepartment_departmentId_status_idx" ON "StudentDepartment"("departmentId", "status");
CREATE UNIQUE INDEX "StudentDepartment_one_active_per_pair" ON "StudentDepartment"("studentId", "departmentId") WHERE "status" = 'ACTIVE';
CREATE INDEX "StudentDepartment_companyId_branchId_idx" ON "StudentDepartment"("companyId", "branchId");
CREATE UNIQUE INDEX "StudentStaffAssignment_userId_branchId_departmentId_key" ON "StudentStaffAssignment"("userId", "branchId", "departmentId");
CREATE INDEX "StudentStaffAssignment_companyId_branchId_idx" ON "StudentStaffAssignment"("companyId", "branchId");
CREATE INDEX "StudentActivity_studentId_occurredAt_idx" ON "StudentActivity"("studentId", "occurredAt");
CREATE INDEX "StudentActivity_companyId_branchId_occurredAt_idx" ON "StudentActivity"("companyId", "branchId", "occurredAt");
CREATE UNIQUE INDEX "StudentAdmissionCode_codeHash_key" ON "StudentAdmissionCode"("codeHash");
CREATE INDEX "StudentAdmissionCode_companyId_branchId_expiresAt_idx" ON "StudentAdmissionCode"("companyId", "branchId", "expiresAt");
CREATE UNIQUE INDEX "OtpChallenge_subjectKey_purpose_key" ON "OtpChallenge"("subjectKey", "purpose");
CREATE INDEX "OtpChallenge_userId_purpose_expiresAt_idx" ON "OtpChallenge"("userId", "purpose", "expiresAt");
CREATE INDEX "OtpChallenge_expiresAt_idx" ON "OtpChallenge"("expiresAt");
CREATE INDEX "OtpRateLimit_windowStartedAt_idx" ON "OtpRateLimit"("windowStartedAt");

ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Branch_companyId_id_key" ON "Branch"("companyId", "id");
-- These composite scope constraints are intentionally stronger than the scalar Prisma relations.
-- Preserve them in future migrations: they prevent cross-organization/branch profiles and memberships.
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_companyId_branchId_fkey" FOREIGN KEY ("companyId", "branchId") REFERENCES "Branch"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentDepartment" ADD CONSTRAINT "StudentDepartment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentDepartment" ADD CONSTRAINT "StudentDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Department_id_companyId_branchId_key" ON "Department"("id", "companyId", "branchId");
ALTER TABLE "StudentDepartment" ADD CONSTRAINT "StudentDepartment_student_company_branch_fkey" FOREIGN KEY ("studentId", "companyId", "branchId") REFERENCES "StudentProfile"("id", "companyId", "branchId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentDepartment" ADD CONSTRAINT "StudentDepartment_department_company_branch_fkey" FOREIGN KEY ("departmentId", "companyId", "branchId") REFERENCES "Department"("id", "companyId", "branchId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentStaffAssignment" ADD CONSTRAINT "StudentStaffAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentStaffAssignment" ADD CONSTRAINT "StudentStaffAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentStaffAssignment" ADD CONSTRAINT "StudentStaffAssignment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentStaffAssignment" ADD CONSTRAINT "StudentStaffAssignment_company_branch_fkey" FOREIGN KEY ("companyId", "branchId") REFERENCES "Branch"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentStaffAssignment" ADD CONSTRAINT "StudentStaffAssignment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentStaffAssignment" ADD CONSTRAINT "StudentStaffAssignment_department_scope_fkey" FOREIGN KEY ("departmentId", "companyId", "branchId") REFERENCES "Department"("id", "companyId", "branchId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentStaffAssignment" ADD CONSTRAINT "StudentStaffAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentActivity" ADD CONSTRAINT "StudentActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentActivity" ADD CONSTRAINT "StudentActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentActivity" ADD CONSTRAINT "StudentActivity_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentActivity" ADD CONSTRAINT "StudentActivity_student_company_branch_fkey" FOREIGN KEY ("studentId", "companyId", "branchId") REFERENCES "StudentProfile"("id", "companyId", "branchId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentActivity" ADD CONSTRAINT "StudentActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentAdmissionCode" ADD CONSTRAINT "StudentAdmissionCode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentAdmissionCode" ADD CONSTRAINT "StudentAdmissionCode_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentAdmissionCode" ADD CONSTRAINT "StudentAdmissionCode_company_branch_fkey" FOREIGN KEY ("companyId", "branchId") REFERENCES "Branch"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OtpChallenge" ADD CONSTRAINT "OtpChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
