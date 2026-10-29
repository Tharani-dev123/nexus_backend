import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "../src/database/index.db.js";
import studentService from "../src/services/student/student.service.js";
import { AppError } from "../src/types/AppError.js";
import { updateStudentSchema } from "../src/schemas/student/student.schema.js";

const tx = vi.hoisted(() => ({
  branch: { findFirst: vi.fn() },
  department: { findMany: vi.fn() },
  user: { update: vi.fn() },
  studentProfile: { update: vi.fn(), findUniqueOrThrow: vi.fn() },
  studentDepartment: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), createMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  studentActivity: { create: vi.fn() },
}));

vi.mock("../src/database/index.db.js", () => ({ default: {
  studentProfile: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  studentStaffAssignment: { findFirst: vi.fn(), findMany: vi.fn() },
  department: { findFirst: vi.fn(), findMany: vi.fn() },
  user: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  branch: { findFirst: vi.fn() },
  studentDepartment: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), createMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  studentActivity: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
  $transaction: vi.fn(async (arg: unknown) => typeof arg === "function" ? (arg as (client: typeof tx) => unknown)(tx) : arg),
} }));

const admin = { id: "admin1", companyId: "co1", userRole: "ADMIN" as const };
const profile = { id: "sp1", userId: "u1", companyId: "co1", branchId: "br1", status: "ACTIVE", memberships: [], user: { id: "u1" } };

describe("single-branch student enrollment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.studentProfile.findFirst).mockResolvedValue(profile as never);
  });

  it("allows multiple department memberships within the student's branch", async () => {
    vi.mocked(tx.department.findMany).mockResolvedValue([
      { id: "d1", companyId: "co1", branchId: "br1" },
      { id: "d2", companyId: "co1", branchId: "br1" },
    ] as never);
    vi.mocked(tx.studentDepartment.findMany).mockResolvedValueOnce([] as never);
    vi.mocked(tx.studentDepartment.findMany).mockResolvedValue([{ id: "m1" }, { id: "m2" }] as never);

    await studentService.replaceDepartments(admin, "co1", "sp1", ["d1", "d2"]);

    expect(tx.studentDepartment.createMany).toHaveBeenCalledWith({ data: [
      expect.objectContaining({ studentId: "sp1", departmentId: "d1", companyId: "co1", branchId: "br1" }),
      expect.objectContaining({ studentId: "sp1", departmentId: "d2", companyId: "co1", branchId: "br1" }),
    ] });
  });

  it.each([
    ["another branch", [{ id: "dx", companyId: "co1", branchId: "br2" }]],
    ["another organization", []],
  ])("rejects a department from %s without changing active memberships", async (_label, matchingDepartments) => {
    vi.mocked(tx.department.findMany).mockResolvedValue(matchingDepartments as never);
    await expect(studentService.replaceDepartments(admin, "co1", "sp1", ["dx"]))
      .rejects.toEqual(new AppError("Every department must belong to the student's organization and branch", 400));
    expect(tx.studentDepartment.updateMany).not.toHaveBeenCalled();
    expect(tx.studentDepartment.createMany).not.toHaveBeenCalled();
  });

  it("rejects branch changes through profile updates, including at the API schema", async () => {
    await expect(studentService.update(admin, "co1", "sp1", { branchId: "br2" }))
      .rejects.toEqual(new AppError("Student organization and branch cannot be changed through profile updates", 400));
    expect(updateStudentSchema.safeParse({ params: { studentId: "sp1" }, body: { branchId: "br2" } }).success).toBe(false);
  });

  it("does not partially mutate memberships when one bulk department is invalid", async () => {
    vi.mocked(tx.department.findMany).mockResolvedValue([{ id: "d1", companyId: "co1", branchId: "br1" }] as never);
    await expect(studentService.replaceDepartments(admin, "co1", "sp1", ["d1", "dx"]))
      .rejects.toEqual(new AppError("Every department must belong to the student's organization and branch", 400));
    expect(tx.studentDepartment.findMany).not.toHaveBeenCalled();
    expect(tx.studentDepartment.updateMany).not.toHaveBeenCalled();
    expect(tx.studentDepartment.createMany).not.toHaveBeenCalled();
  });

  it("ends a membership while preserving its historical row", async () => {
    vi.mocked(tx.studentDepartment.findFirst).mockResolvedValue({ id: "membership1" } as never);
    vi.mocked(tx.studentDepartment.update).mockResolvedValue({ id: "membership1", status: "ENDED" } as never);
    await studentService.endDepartment(admin, "co1", "sp1", "d1");
    expect(tx.studentDepartment.update).toHaveBeenCalledWith({ where: { id: "membership1" }, data: { status: "ENDED", leftAt: expect.any(Date) } });
  });

  it("rejects unauthorized cross-branch and cross-tenant student access", async () => {
    vi.mocked(prisma.studentProfile.findFirst).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    await expect(studentService.get({ id: "hr1", companyId: "co1", userRole: "HR" }, "other-branch-student", "co1"))
      .rejects.toEqual(new AppError("Student not found", 404));
    await expect(studentService.get(admin, "other-tenant-student", "other-company"))
      .rejects.toEqual(new AppError("Student not found", 404));
  });

  it("rejects staff without a matching branch assignment", async () => {
    vi.mocked(prisma.studentStaffAssignment.findFirst).mockResolvedValue(null);
    await expect(studentService.get({ id: "hr1", companyId: "co1", userRole: "HR" }, "sp1", "co1"))
      .rejects.toEqual(new AppError("Forbidden: student is outside your assigned scope", 403));
  });
});
