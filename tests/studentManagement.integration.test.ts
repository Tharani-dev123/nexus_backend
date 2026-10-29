import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/aws/index.service.js", () => ({ default: { EMAIL: { sendEmail: vi.fn().mockResolvedValue(undefined) } } }));

const testUrl = process.env.TEST_DATABASE_URL?.trim();
// The runner sets this marker only after checking the configured Neon branch
// through Neon's API. Do not repeat a database-name heuristic here: Neon
// branches commonly share the same database name (for example, `neondb`).
const integrationEnabled = Boolean(
  process.env.STUDENT_INTEGRATION_SAFE === "1" &&
  testUrl &&
  testUrl === process.env.DATABASE_URL?.trim(),
);

describe.skipIf(!integrationEnabled)("student and authentication PostgreSQL integration", () => {
  let prisma: (typeof import("../src/database/index.db.js"))["default"];
  let students: typeof import("../src/services/student/student.service.js")["default"];
  let onboarding: typeof import("../src/services/student/studentOnboarding.service.js");
  let otp: typeof import("../src/services/auth/OTP/persistentOtp.service.js");
  let verifyLoginOtp: typeof import("../src/services/auth/email/verifyLoginOtp.service.js")["default"];
  let resetPassword: typeof import("../src/services/auth/email/resetPassword.service.js")["default"];
  let authPassword: typeof import("../src/services/auth/password/validateUserPassword.service.js")["default"];
  let aws: typeof import("../src/services/aws/index.service.js")["default"];
  let setupComplete: typeof import("../src/services/student/studentOnboarding.service.js")["completeStudentSetup"];
  let loginByEmail: typeof import("../src/services/auth/email/loginInByEmail.service.js")["loginByEmail"];
  let authenticate: typeof import("../src/middleware/auth.middleware.js")["default"];
  let changePassword: typeof import("../src/services/user/update/changePassword.service.js")["changePassword"];
  let authServices: typeof import("../src/services/auth/index.service.js")["default"];
  const fixtures: Array<{ companyId: string; adminId: string; emails: string[] }> = [];

  beforeAll(async () => {
    if (!integrationEnabled) return;
    process.env.DATABASE_URL = testUrl;
    ({ default: prisma } = await import("../src/database/index.db.js"));
    ({ default: students } = await import("../src/services/student/student.service.js"));
    onboarding = await import("../src/services/student/studentOnboarding.service.js");
    otp = await import("../src/services/auth/OTP/persistentOtp.service.js");
    ({ default: verifyLoginOtp } = await import("../src/services/auth/email/verifyLoginOtp.service.js"));
    ({ default: resetPassword } = await import("../src/services/auth/email/resetPassword.service.js"));
    ({ default: authPassword } = await import("../src/services/auth/password/validateUserPassword.service.js"));
    ({ default: aws } = await import("../src/services/aws/index.service.js"));
    ({ loginByEmail } = await import("../src/services/auth/email/loginInByEmail.service.js"));
    ({ default: authenticate } = await import("../src/middleware/auth.middleware.js"));
    ({ changePassword } = await import("../src/services/user/update/changePassword.service.js"));
    ({ default: authServices } = await import("../src/services/auth/index.service.js"));
    setupComplete = onboarding.completeStudentSetup;
  }, 30000);

  async function createFixture() {
    const tag = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const company = await prisma.company.create({ data: { name: `Integration ${tag}` } });
    const admin = await prisma.user.create({ data: { name: "Integration Admin", email: `admin-${tag}@integration.test`, userRole: "ADMIN", companyId: company.id } });
    const branch = await prisma.branch.create({ data: { companyId: company.id, name: "Branch A", code: `A-${tag}` } });
    const otherBranch = await prisma.branch.create({ data: { companyId: company.id, name: "Branch B", code: `B-${tag}` } });
    const departmentA = await prisma.department.create({ data: { companyId: company.id, branchId: branch.id, name: `Dept A ${tag}` } });
    const departmentB = await prisma.department.create({ data: { companyId: company.id, branchId: branch.id, name: `Dept B ${tag}` } });
    const otherBranchDepartment = await prisma.department.create({ data: { companyId: company.id, branchId: otherBranch.id, name: `Dept Other ${tag}` } });
    const value = { companyId: company.id, adminId: admin.id, admin: { id: admin.id, companyId: company.id, userRole: "ADMIN" as const }, branch, otherBranch, departmentA, departmentB, otherBranchDepartment, emails: [admin.email] };
    fixtures.push(value);
    return value;
  }

  async function makeSignupCode(fx: Awaited<ReturnType<typeof createFixture>>, options: { allowsSelfRegistration?: boolean; requiresApproval?: boolean; branchId?: string } = {}) {
    return onboarding.createAdmissionCode(fx.admin, fx.companyId, {
      branchId: options.branchId ?? fx.branch.id, maxUses: 20, expiresInDays: 3,
      allowsSelfRegistration: options.allowsSelfRegistration ?? false,
      requiresApproval: options.requiresApproval ?? false,
    });
  }

  async function register(fx: Awaited<ReturnType<typeof createFixture>>, code: string, overrides: Record<string, unknown> = {}) {
    const email = `student-${Date.now()}-${Math.random().toString(16).slice(2)}@integration.test`;
    fx.emails.push(email);
    return onboarding.registerWithAdmissionCode({
      code, name: "Integration Student", email, password: "ValidStudentPassword123!",
      admissionNumber: `ADM-${Date.now()}-${Math.random().toString(16).slice(2)}`, departmentIds: [], ...overrides,
    } as Parameters<typeof onboarding.registerWithAdmissionCode>[0], "192.0.2.10");
  }

  async function cleanupFixture(fx: (typeof fixtures)[number]) {
    await prisma.studentActivity.deleteMany({ where: { companyId: fx.companyId } });
    await prisma.studentDepartment.deleteMany({ where: { companyId: fx.companyId } });
    await prisma.studentProfile.deleteMany({ where: { companyId: fx.companyId } });
    await prisma.studentStaffAssignment.deleteMany({ where: { companyId: fx.companyId } });
    await prisma.studentAdmissionCode.deleteMany({ where: { companyId: fx.companyId } });
    await prisma.user.deleteMany({ where: { OR: [{ id: fx.adminId }, { email: { in: fx.emails } }] } });
    await prisma.department.deleteMany({ where: { companyId: fx.companyId } });
    await prisma.branch.deleteMany({ where: { companyId: fx.companyId } });
    await prisma.company.deleteMany({ where: { id: fx.companyId } });
  }

  afterAll(async () => {
    if (!integrationEnabled || !prisma) return;
    for (const fixture of fixtures) await cleanupFixture(fixture);
    await prisma.$disconnect();
  }, 30000);

  it("enforces self-registration settings, code branch scope, and approval", async () => {
    const fx = await createFixture();
    const code = await makeSignupCode(fx, { allowsSelfRegistration: true, requiresApproval: true });
    await expect(register(fx, code.code)).rejects.toThrow("Invalid or unavailable student setup request");
    await onboarding.setSelfRegistration(fx.admin, fx.companyId, true);
    const student = await register(fx, code.code, { departmentIds: [fx.departmentA.id, fx.departmentB.id] });
    expect(student.status).toBe("PENDING_APPROVAL");
    expect(await prisma.studentDepartment.count({ where: { studentId: student.id, status: "ACTIVE" } })).toBe(2);
    const blockedLogin = await otp.issuePersistentOtp(student.user.email, "LOGIN", student.user.id, "192.0.2.13");
    await expect(verifyLoginOtp(student.user.email, blockedLogin!, { ip: "192.0.2.13", headers: {} } as never)).rejects.toThrow("Invalid or expired login code");
    expect(await prisma.otpChallenge.findFirst({ where: { userId: student.user.id, purpose: "LOGIN" } })).toMatchObject({ consumedAt: expect.any(Date) });
    const approved = await students.setStatus(fx.admin, fx.companyId, student.id, "ACTIVE");
    expect(approved.status).toBe("ACTIVE");
    await students.setStatus(fx.admin, fx.companyId, student.id, "SUSPENDED");
    const resetCode = await otp.issuePersistentOtp(student.user.email, "PASSWORD_RESET", student.user.id, "192.0.2.14");
    await expect(resetPassword(student.user.email, resetCode!, "ChangedStudentPassword123!", "192.0.2.14")).rejects.toThrow("Invalid or expired OTP");
    expect(await prisma.otpChallenge.findFirst({ where: { userId: student.user.id, purpose: "PASSWORD_RESET" } })).toMatchObject({ consumedAt: expect.any(Date) });
  });

  it("rejects cross-branch and cross-tenant departments without partial changes", async () => {
    const fx = await createFixture();
    const code = await makeSignupCode(fx);
    const student = await register(fx, code.code, { departmentIds: [fx.departmentA.id] });
    await expect(students.replaceDepartments(fx.admin, fx.companyId, student.id, [fx.departmentA.id, fx.otherBranchDepartment.id]))
      .rejects.toThrow("Every department must belong to the student's organization and branch");
    await expect(prisma.studentDepartment.create({ data: {
      studentId: student.id, departmentId: fx.otherBranchDepartment.id, companyId: fx.companyId, branchId: fx.branch.id,
    } })).rejects.toThrow();
    expect(await prisma.studentDepartment.count({ where: { studentId: student.id, status: "ACTIVE" } })).toBe(1);
    const foreignCompany = await prisma.company.create({ data: { name: `Foreign ${Date.now()}` } });
    const foreignBranch = await prisma.branch.create({ data: { companyId: foreignCompany.id, name: "Foreign", code: `F-${Date.now()}` } });
    const foreignDepartment = await prisma.department.create({ data: { companyId: foreignCompany.id, branchId: foreignBranch.id, name: "Foreign Dept" } });
    await expect(students.addDepartment(fx.admin, fx.companyId, student.id, foreignDepartment.id)).rejects.toThrow();
    await prisma.department.delete({ where: { id: foreignDepartment.id } });
    await prisma.branch.delete({ where: { id: foreignBranch.id } });
    await prisma.company.delete({ where: { id: foreignCompany.id } });
  });

  it("preserves ended membership history and rejects ordinary branch updates", async () => {
    const fx = await createFixture();
    const code = await makeSignupCode(fx);
    const student = await register(fx, code.code, { departmentIds: [fx.departmentA.id] });
    await expect(students.update(fx.admin, fx.companyId, student.id, { branchId: fx.otherBranch.id })).rejects.toThrow("branch cannot be changed");
    await students.endDepartment(fx.admin, fx.companyId, student.id, fx.departmentA.id);
    const history = await prisma.studentDepartment.findMany({ where: { studentId: student.id, departmentId: fx.departmentA.id } });
    expect(history).toHaveLength(1);
    expect(history[0].status).toBe("ENDED");
    expect(history[0].leftAt).toBeInstanceOf(Date);
  });

  it("rejects cross-tenant and unauthorized cross-branch reads", async () => {
    const fx = await createFixture();
    const code = await makeSignupCode(fx, { branchId: fx.otherBranch.id });
    const student = await register(fx, code.code);
    const staff = await prisma.user.create({ data: { name: "Scoped HR", email: `hr-${Date.now()}@integration.test`, userRole: "HR", companyId: fx.companyId } });
    fx.emails.push(staff.email);
    await prisma.studentStaffAssignment.create({ data: { userId: staff.id, companyId: fx.companyId, branchId: fx.branch.id, createdById: fx.adminId } });
    await expect(students.get(fx.admin, student.id, `foreign-${fx.companyId}`)).rejects.toThrow("Student not found");
    await expect(students.get({ id: staff.id, companyId: fx.companyId, userRole: "HR" }, student.id, fx.companyId)).rejects.toThrow("outside your assigned scope");
  });

  it("rolls back account and profile creation when its activity FK fails", async () => {
    const fx = await createFixture();
    const email = `rollback-${Date.now()}@integration.test`;
    await expect(students.create({ id: "missing-admin", companyId: fx.companyId, userRole: "ADMIN" }, fx.companyId, {
      name: "Rollback Student", email, branchId: fx.branch.id, admissionNumber: `ROLL-${Date.now()}`, departmentIds: [fx.departmentA.id],
    })).rejects.toThrow();
    expect(await prisma.user.findUnique({ where: { email } })).toBeNull();
    expect(await prisma.studentProfile.count({ where: { user: { email } } })).toBe(0);
  });

  it("requires staff-created student setup before credentials or normal access", async () => {
    const fx = await createFixture();
    const email = `setup-${Date.now()}@integration.test`;
    fx.emails.push(email);
    const student = await students.create(fx.admin, fx.companyId, { name: "Setup Student", email, branchId: fx.branch.id, admissionNumber: `SET-${Date.now()}`, departmentIds: [] }, "192.0.2.11");
    const created = await prisma.user.findUnique({ where: { id: student.userId }, include: { credential: true } });
    expect(created?.mustChangePassword).toBe(true);
    expect(created?.credential).toBeNull();
    const mailer = aws.EMAIL.sendEmail as unknown as ReturnType<typeof vi.fn>;
    const text = mailer.mock.calls.at(-1)?.[0]?.text as string;
    const setupCode = text.match(/\b\d{6}\b/)?.[0];
    expect(setupCode).toBeTruthy();
    await setupComplete(email, setupCode!, "NewStudentPassword123!", "192.0.2.12");
    const completed = await prisma.user.findUnique({ where: { id: student.userId }, include: { credential: true } });
    expect(completed?.mustChangePassword).toBe(false);
    expect(completed?.credential).not.toBeNull();
  });

  it("restricts a temporary-password session to password change until setup completes", async () => {
    const fx = await createFixture();
    const email = `forced-${Date.now()}@integration.test`;
    fx.emails.push(email);
    const passwordHash = await authServices.PASSWORD.hashPassword("TemporaryPassword123!");
    const user = await prisma.user.create({ data: {
      name: "Forced Change", email, userRole: "STUDENT", companyId: fx.companyId,
      isEmailVerified: true, mustChangePassword: true,
      credential: { create: { type: "EMAIL", passwordHash } },
      studentProfile: { create: { companyId: fx.companyId, branchId: fx.branch.id, admissionNumber: `FORCE-${Date.now()}` } },
    } });
    const login = await loginByEmail(email, "TemporaryPassword123!");
    const blockedRequest = { header: () => `Bearer ${login.accessToken}`, method: "GET", baseUrl: "/api/user", path: "/me" } as never;
    await expect(authenticate(blockedRequest, {} as never, vi.fn())).rejects.toThrow("Password setup is required");
    const allowedRequest = { header: () => `Bearer ${login.accessToken}`, method: "POST", baseUrl: "/api/user", path: "/change-password" } as never;
    const next = vi.fn();
    await authenticate(allowedRequest, {} as never, next);
    expect(next).toHaveBeenCalledOnce();
    await changePassword(user.id, "TemporaryPassword123!", "PermanentPassword123!");
    expect((await prisma.user.findUnique({ where: { id: user.id } }))?.mustChangePassword).toBe(false);
  });

  it("validates login OTP once and resets the password using a persistent challenge", async () => {
    const fx = await createFixture();
    const code = await makeSignupCode(fx);
    const student = await register(fx, code.code);
    const loginCode = await otp.issuePersistentOtp(student.user.email, "LOGIN", student.user.id, "192.0.2.20");
    const req = { ip: "192.0.2.20", headers: {} } as never;
    const login = await verifyLoginOtp(student.user.email, loginCode!, req);
    expect(login.user.userRole).toBe("STUDENT");
    await expect(verifyLoginOtp(student.user.email, loginCode!, req)).rejects.toThrow("Invalid or expired login code");
    const resetCode = await otp.issuePersistentOtp(student.user.email, "PASSWORD_RESET", student.user.id, "192.0.2.21");
    await resetPassword(student.user.email, resetCode!, "ChangedStudentPassword123!", "192.0.2.21");
    await expect(authPassword(student.user.email, "ValidStudentPassword123!")).rejects.toThrow("Invalid password");
    await expect(authPassword(student.user.email, "ChangedStudentPassword123!")).resolves.toMatchObject({ id: student.user.id });
  });

  it("enforces OTP cooldown, expiry, and failed-attempt limits", async () => {
    const fx = await createFixture();
    const code = await makeSignupCode(fx);
    const student = await register(fx, code.code);
    const first = await otp.issuePersistentOtp(student.user.email, "LOGIN", student.user.id, "192.0.2.30");
    expect(first).toHaveLength(6);
    await expect(otp.issuePersistentOtp(student.user.email, "LOGIN", student.user.id, "192.0.2.30")).resolves.toBeNull();
    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(otp.consumePersistentOtp(student.user.email, "LOGIN", "000000", student.user.id, `192.0.2.${40 + attempt}`)).resolves.toBe(false);
    }
    await expect(otp.consumePersistentOtp(student.user.email, "LOGIN", first!, student.user.id, "192.0.2.50")).resolves.toBe(false);
    const reset = await otp.issuePersistentOtp(student.user.email, "PASSWORD_RESET", student.user.id, "192.0.2.31");
    await prisma.otpChallenge.updateMany({ where: { userId: student.user.id, purpose: "PASSWORD_RESET" }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(otp.consumePersistentOtp(student.user.email, "PASSWORD_RESET", reset!, student.user.id, "192.0.2.32")).resolves.toBe(false);
  });
});
