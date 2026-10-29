import { z } from "zod";

const optionalText = (max = 500) => z.string().trim().max(max).optional().nullable();
const id = z.string().min(1).max(100);
export const createStudentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(150),
    email: z.email().max(254),
    branchId: id,
    admissionNumber: z.string().trim().min(1).max(64),
    departmentIds: z.array(id).max(50).optional().default([]),
    dateOfBirth: z.iso.date().optional(), phone: z.string().trim().max(32).optional(),
    address: optionalText(), guardianName: optionalText(150), guardianPhone: z.string().trim().max(32).optional().nullable(),
    guardianEmail: z.email().optional().nullable(), emergencyContact: optionalText(200), enrollmentDate: z.iso.date().optional(),
  }),
});
export const listStudentsSchema = z.object({ query: z.object({
  branchId: id.optional(), departmentId: id.optional(), status: z.enum(["PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "INACTIVE", "ARCHIVED", "REJECTED"]).optional(),
  search: z.string().trim().max(100).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20),
}) });
export const studentIdSchema = z.object({ params: z.object({ studentId: id }) });
export const updateStudentSchema = z.object({ params: z.object({ studentId: id }), body: z.object({
  name: z.string().trim().min(1).max(150).optional(), admissionNumber: z.string().trim().min(1).max(64).optional(),
  dateOfBirth: z.iso.date().nullable().optional(), phone: z.string().trim().max(32).nullable().optional(), address: optionalText(),
  guardianName: optionalText(150), guardianPhone: z.string().trim().max(32).nullable().optional(), guardianEmail: z.email().nullable().optional(),
  emergencyContact: optionalText(200), enrollmentDate: z.iso.date().optional(),
}).strict().refine((value) => Object.keys(value).length > 0) });
export const statusSchema = z.object({ params: z.object({ studentId: id }), body: z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE", "ARCHIVED"]) }) });
export const departmentsSchema = z.object({ params: z.object({ studentId: id }), body: z.object({ departmentIds: z.array(id).max(50) }) });
export const selfUpdateSchema = z.object({ body: z.object({ name: z.string().trim().min(1).max(150).optional(), phone: z.string().trim().max(32).nullable().optional(), address: optionalText(), guardianName: optionalText(150), guardianPhone: z.string().trim().max(32).nullable().optional(), guardianEmail: z.email().nullable().optional(), emergencyContact: optionalText(200) }).refine((value) => Object.keys(value).length > 0) });
export const staffAssignmentSchema = z.object({ body: z.object({ userId: id, branchId: id, departmentId: id.optional() }) });
export const rejectStudentSchema = z.object({ params: z.object({ studentId: id }), body: z.object({ reason: z.string().trim().max(500).optional() }) });
export const departmentIdSchema = z.object({ params: z.object({ studentId: id, departmentId: id }) });
export const addDepartmentSchema = z.object({ params: z.object({ studentId: id }), body: z.object({ departmentId: id }) });
export const studentSignupSchema = z.object({ body: z.object({
  code: z.string().trim().min(20).max(200), name: z.string().trim().min(1).max(150), email: z.email().max(254),
  password: z.string().min(8).max(72), admissionNumber: z.string().trim().min(1).max(64), departmentIds: z.array(id).max(50).default([]),
  dateOfBirth: z.iso.date().optional(), phone: z.string().trim().max(32).optional(), address: optionalText(),
  guardianName: optionalText(150), guardianPhone: z.string().trim().max(32).nullable().optional(),
  guardianEmail: z.email().nullable().optional(), emergencyContact: optionalText(200),
}).strict() });
export const admissionCodeSchema = z.object({ body: z.object({
  branchId: id, maxUses: z.number().int().min(1).max(1000).default(1), expiresInDays: z.number().int().min(1).max(365).default(7),
  allowsSelfRegistration: z.boolean().default(false), requiresApproval: z.boolean().default(true),
}) });
export const selfRegistrationSettingSchema = z.object({ body: z.object({ enabled: z.boolean() }) });
