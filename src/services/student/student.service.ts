import { OtpPurpose, Prisma, StudentStatus, UserRole } from "@prisma/client";
import prisma from "../../database/index.db.js";
import { AppError } from "../../types/AppError.js";
import OTP_SERVICE from "../auth/OTP/persistentOtp.service.js";
import AWS_SERVICE from "../aws/index.service.js";

type Actor = { id: string; companyId: string | null; userRole: UserRole };
const companyAdmins: UserRole[] = ["OWNER", "SUPER_ADMIN", "COMPANY_ADMIN", "ADMIN"];
const appendCondition = (where: Prisma.StudentProfileWhereInput, condition: Prisma.StudentProfileWhereInput) => {
  const existing = where.AND;
  where.AND = [...(Array.isArray(existing) ? existing : existing ? [existing] : []), condition];
};

async function studentAccess(actor: Actor, studentId: string, companyId: string) {
  const student = await prisma.studentProfile.findFirst({ where: { id: studentId, companyId, user: { deletedAt: null } }, include: { user: { select: { id: true, name: true, email: true, createdAt: true } }, memberships: { where: { status: "ACTIVE" }, include: { department: true } } } });
  if (!student) throw new AppError("Student not found", 404);
  if (companyAdmins.includes(actor.userRole)) return student;
  const scope = await prisma.studentStaffAssignment.findFirst({ where: { userId: actor.id, companyId, branchId: student.branchId } });
  if (!scope) throw new AppError("Forbidden: student is outside your assigned scope", 403);
  const branchWide = await prisma.studentStaffAssignment.findFirst({ where: { userId: actor.id, companyId, branchId: student.branchId, departmentId: null } });
  if (!branchWide) {
    const departmentScopes = await prisma.studentStaffAssignment.findMany({ where: { userId: actor.id, companyId, branchId: student.branchId, departmentId: { not: null } }, select: { departmentId: true } });
    const departmentIds = departmentScopes.flatMap((item) => item.departmentId ? [item.departmentId] : []);
    if (!student.memberships.some((membership) => departmentIds.includes(membership.departmentId))) throw new AppError("Forbidden: student is outside your department scope", 403);
  }
  return student;
}

async function validateDepartments(tx: Pick<Prisma.TransactionClient, "department">, companyId: string, branchId: string, departmentIds: string[]) {
  if (departmentIds.length === 0) return;
  const uniqueIds = [...new Set(departmentIds)];
  const departments = await tx.department.findMany({ where: { id: { in: uniqueIds }, companyId, deletedAt: null } });
  if (departments.length !== uniqueIds.length || departments.some((item) => item.branchId !== branchId)) {
    throw new AppError("Every department must belong to the student's organization and branch", 400);
  }
}

async function create(actor: Actor, companyId: string, input: {
  name: string; email: string; branchId: string; admissionNumber: string; departmentIds: string[];
  dateOfBirth?: string; phone?: string; address?: string | null; guardianName?: string | null;
  guardianPhone?: string | null; guardianEmail?: string | null; emergencyContact?: string | null; enrollmentDate?: string;
}, ipAddress = "unknown") {
  let staffDepartmentScope: string[] | null = null;
  if (!companyAdmins.includes(actor.userRole)) {
    const scopes = await prisma.studentStaffAssignment.findMany({ where: { userId: actor.id, companyId, branchId: input.branchId }, select: { departmentId: true } });
    if (!scopes.length) throw new AppError("Forbidden: branch is outside your assigned scope", 403);
    if (!scopes.some((scope) => scope.departmentId === null)) {
      staffDepartmentScope = scopes.flatMap((scope) => scope.departmentId ? [scope.departmentId] : []);
      if (!input.departmentIds.length || input.departmentIds.some((departmentId) => !staffDepartmentScope?.includes(departmentId))) {
        throw new AppError("Forbidden: department is outside your assigned scope", 403);
      }
    }
  }
  const email = input.email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) throw new AppError("Email already in use", 409);
  const status: StudentStatus = "ACTIVE";
  const result = await prisma.$transaction(async (tx) => {
    const branch = await tx.branch.findFirst({ where: { id: input.branchId, companyId, deletedAt: null, isActive: true } });
    if (!branch) throw new AppError("Branch not found in this organization", 400);
    await validateDepartments(tx, companyId, input.branchId, input.departmentIds);
    const user = await tx.user.create({ data: { name: input.name, email, userRole: "STUDENT", companyId, isEmailVerified: false, mustChangePassword: true } });
    const profile = await tx.studentProfile.create({ data: {
      userId: user.id, companyId, branchId: input.branchId, admissionNumber: input.admissionNumber.trim(), status,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined, phone: input.phone,
      address: input.address, guardianName: input.guardianName, guardianPhone: input.guardianPhone,
      guardianEmail: input.guardianEmail, emergencyContact: input.emergencyContact,
      enrollmentDate: input.enrollmentDate ? new Date(input.enrollmentDate) : undefined,
    } });
    if (input.departmentIds.length) await tx.studentDepartment.createMany({ data: [...new Set(input.departmentIds)].map((departmentId) => ({ studentId: profile.id, departmentId, companyId, branchId: input.branchId, assignedById: actor.id })) });
    await tx.studentActivity.create({ data: { studentId: profile.id, companyId, branchId: input.branchId, actorId: actor.id, type: "REGISTERED", description: "Student account registered" } });
    return tx.studentProfile.findUniqueOrThrow({ where: { id: profile.id }, include: { user: { select: { id: true, name: true, email: true } }, memberships: { where: { status: "ACTIVE" }, include: { department: true } } } });
  });
  const setupCode = await OTP_SERVICE.issuePersistentOtp(email, OtpPurpose.STUDENT_SETUP, result.userId, ipAddress);
  if (setupCode) await AWS_SERVICE.EMAIL.sendEmail({ to: [email], subject: "Set up your student account", text: `Your one-time account setup code is: ${setupCode}. It expires in 10 minutes.` });
  return result;
}

async function list(actor: Actor, companyId: string, query: { branchId?: string; departmentId?: string; status?: StudentStatus; search?: string; page: number; limit: number }) {
  const where: Prisma.StudentProfileWhereInput = { companyId, ...(query.status ? { status: query.status } : {}), ...(query.search ? { OR: [{ admissionNumber: { contains: query.search, mode: "insensitive" } }, { user: { name: { contains: query.search, mode: "insensitive" } } }, { user: { email: { contains: query.search, mode: "insensitive" } } }] } : {}) };
  let scopedBranchIds: string[] | undefined;
  const branchWideIds = new Set<string>();
  const departmentScopesByBranch = new Map<string, string[]>();
  if (companyAdmins.includes(actor.userRole)) {
    if (query.branchId) {
      const branch = await prisma.branch.findFirst({ where: { id: query.branchId, companyId, deletedAt: null } });
      if (!branch) throw new AppError("Branch is outside the requested organization", 403);
      where.branchId = query.branchId;
    }
  } else {
    const scopes = await prisma.studentStaffAssignment.findMany({ where: { userId: actor.id, companyId, ...(query.branchId ? { branchId: query.branchId } : {}) }, select: { branchId: true, departmentId: true } });
    if (!scopes.length) throw new AppError("Forbidden: no student scope is assigned", 403);
    const branchIds = [...new Set(scopes.map((item) => item.branchId))];
    scopedBranchIds = branchIds;
    where.branchId = { in: branchIds };
    for (const scope of scopes) {
      if (scope.departmentId === null) branchWideIds.add(scope.branchId);
      else departmentScopesByBranch.set(scope.branchId, [...(departmentScopesByBranch.get(scope.branchId) ?? []), scope.departmentId]);
    }
    const scopeConditions: Prisma.StudentProfileWhereInput[] = [
      ...[...branchWideIds].map((branchId) => ({ branchId })),
      ...[...departmentScopesByBranch].filter(([branchId]) => !branchWideIds.has(branchId)).map(([branchId, departmentIds]) => ({ branchId, memberships: { some: { status: "ACTIVE", departmentId: { in: departmentIds } } } })),
    ];
    appendCondition(where, { OR: scopeConditions });
  }
  if (query.departmentId) {
    const department = await prisma.department.findFirst({ where: { id: query.departmentId, companyId, deletedAt: null } });
    const staffDepartmentAllowed = department?.branchId && (branchWideIds.has(department.branchId) || (departmentScopesByBranch.get(department.branchId) ?? []).includes(query.departmentId));
    if (!department || (query.branchId && department.branchId !== query.branchId) || (scopedBranchIds && (!department.branchId || !scopedBranchIds.includes(department.branchId))) || (scopedBranchIds && !staffDepartmentAllowed)) throw new AppError("Department is outside the authorized organization, branch, or department scope", 403);
    appendCondition(where, { memberships: { some: { status: "ACTIVE", departmentId: query.departmentId } } });
  }
  const [items, total] = await prisma.$transaction([prisma.studentProfile.findMany({ where, include: { user: { select: { id: true, name: true, email: true } }, memberships: { where: { status: "ACTIVE" }, include: { department: true } } }, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit }), prisma.studentProfile.count({ where })]);
  return { items, total, page: query.page, limit: query.limit };
}

async function update(actor: Actor, companyId: string, studentId: string, input: Record<string, unknown>) {
  if ("branchId" in input || "companyId" in input) throw new AppError("Student organization and branch cannot be changed through profile updates", 400);
  const current = await studentAccess(actor, studentId, companyId);
  if (!companyAdmins.includes(actor.userRole) && current.status !== "ACTIVE") throw new AppError("Forbidden", 403);
  const { name, ...profileFields } = input;
  return prisma.$transaction(async (tx) => {
    if (typeof name === "string") await tx.user.update({ where: { id: current.userId }, data: { name } });
    const updated = await tx.studentProfile.update({ where: { id: studentId }, data: profileFields });
    await tx.studentActivity.create({ data: { studentId, companyId, branchId: current.branchId, actorId: actor.id, type: "PROFILE_UPDATED", description: "Student profile updated" } });
    return updated;
  });
}

async function setStatus(actor: Actor, companyId: string, studentId: string, status: StudentStatus, rejectionReason?: string) {
  if (!companyAdmins.includes(actor.userRole)) throw new AppError("Forbidden: administrator role required", 403);
  const current = await studentAccess(actor, studentId, companyId);
  const allowed: Record<StudentStatus, StudentStatus[]> = { PENDING_APPROVAL: ["ACTIVE", "REJECTED"], ACTIVE: ["SUSPENDED", "INACTIVE", "ARCHIVED"], SUSPENDED: ["ACTIVE", "INACTIVE", "ARCHIVED"], INACTIVE: ["ACTIVE", "ARCHIVED"], ARCHIVED: [], REJECTED: [] };
  if (!allowed[current.status].includes(status)) throw new AppError(`Cannot change student status from ${current.status} to ${status}`, 409);
  return prisma.$transaction(async (tx) => {
    const result = await tx.studentProfile.update({ where: { id: studentId }, data: { status, ...(status === "ACTIVE" ? { approvedAt: new Date(), approvedById: actor.id } : {}), ...(status === "ARCHIVED" ? { archivedAt: new Date() } : {}), ...(status === "REJECTED" ? { rejectionReason } : {}) } });
    await tx.studentActivity.create({ data: { studentId, companyId, branchId: current.branchId, actorId: actor.id, type: `STATUS_${status}`, description: `Student status changed to ${status}` } });
    return result;
  });
}

async function replaceDepartments(actor: Actor, companyId: string, studentId: string, departmentIds: string[]) {
  const student = await studentAccess(actor, studentId, companyId);
  const desired = [...new Set(departmentIds)];
  return prisma.$transaction(async (tx) => {
    await validateDepartments(tx, companyId, student.branchId, desired);
    const active = await tx.studentDepartment.findMany({ where: { studentId, status: "ACTIVE" } });
    const remove = active.filter((item) => !desired.includes(item.departmentId));
    if (remove.length) await tx.studentDepartment.updateMany({ where: { id: { in: remove.map((item) => item.id) } }, data: { status: "ENDED", leftAt: new Date() } });
    const existingIds = new Set(active.map((item) => item.departmentId));
    const add = desired.filter((departmentId) => !existingIds.has(departmentId));
    if (add.length) await tx.studentDepartment.createMany({ data: add.map((departmentId) => ({ studentId, departmentId, companyId, branchId: student.branchId, assignedById: actor.id })) });
    await tx.studentActivity.create({ data: { studentId, companyId, branchId: student.branchId, actorId: actor.id, type: "DEPARTMENTS_UPDATED", description: "Student department memberships updated", metadata: { added: add, ended: remove.map((item) => item.departmentId) } } });
    return tx.studentDepartment.findMany({ where: { studentId }, include: { department: true }, orderBy: { joinedAt: "desc" } });
  });
}

async function addDepartment(actor: Actor, companyId: string, studentId: string, departmentId: string) {
  const student = await studentAccess(actor, studentId, companyId);
  return prisma.$transaction(async (tx) => {
    await validateDepartments(tx, companyId, student.branchId, [departmentId]);
    const active = await tx.studentDepartment.findFirst({ where: { studentId, departmentId, status: "ACTIVE" } });
    if (active) return active;
    const membership = await tx.studentDepartment.create({ data: { studentId, departmentId, companyId, branchId: student.branchId, assignedById: actor.id } });
    await tx.studentActivity.create({ data: { studentId, companyId, branchId: student.branchId, actorId: actor.id, type: "DEPARTMENT_ENROLLED", description: "Student enrolled in a department", metadata: { departmentId } } });
    return membership;
  });
}

async function endDepartment(actor: Actor, companyId: string, studentId: string, departmentId: string) {
  const student = await studentAccess(actor, studentId, companyId);
  return prisma.$transaction(async (tx) => {
    const membership = await tx.studentDepartment.findFirst({ where: { studentId, departmentId, status: "ACTIVE" } });
    if (!membership) throw new AppError("Active department membership not found", 404);
    const updated = await tx.studentDepartment.update({ where: { id: membership.id }, data: { status: "ENDED", leftAt: new Date() } });
    await tx.studentActivity.create({ data: { studentId, companyId, branchId: student.branchId, actorId: actor.id, type: "DEPARTMENT_ENDED", description: "Student department membership ended", metadata: { departmentId } } });
    return updated;
  });
}

async function addActivity(input: { studentId: string; companyId: string; branchId: string; actorId?: string; type: string; description: string; metadata?: Prisma.InputJsonValue; sourceModule?: string; sourceRecordId?: string }, tx: Prisma.TransactionClient = prisma) {
  return tx.studentActivity.create({ data: input });
}

async function assignStaff(actor: Actor, companyId: string, userId: string, branchId: string, departmentId?: string) {
  if (!companyAdmins.includes(actor.userRole)) throw new AppError("Forbidden: administrator role required", 403);
  const [staff, branch] = await Promise.all([
    prisma.user.findFirst({ where: { id: userId, companyId, deletedAt: null } }),
    prisma.branch.findFirst({ where: { id: branchId, companyId, deletedAt: null } }),
  ]);
  if (!staff || !["HR", "MANAGER", "ADMIN", "COMPANY_ADMIN"].includes(staff.userRole)) throw new AppError("User is not an eligible organization staff member", 400);
  if (!branch) throw new AppError("Branch not found in this organization", 400);
  if (departmentId) await prisma.$transaction(async (tx) => validateDepartments(tx, companyId, branchId, [departmentId]));
  const existing = await prisma.studentStaffAssignment.findFirst({ where: { userId, branchId, departmentId: departmentId ?? null } });
  return existing ?? prisma.studentStaffAssignment.create({ data: { userId, companyId, branchId, departmentId, createdById: actor.id } });
}

export default { create, list, get: studentAccess, update, setStatus, replaceDepartments, addDepartment, endDepartment, addActivity, assignStaff };
