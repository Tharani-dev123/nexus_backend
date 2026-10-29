import { Request, Response } from "express";
import { StudentStatus } from "@prisma/client";
import prisma from "../database/index.db.js";
import { AppError } from "../types/AppError.js";
import { successDataResponse, successMessageResponse } from "../handlers/serverResponse.handler.js";
import STUDENT_SERVICE from "../services/student/student.service.js";
import * as STUDENT_ONBOARDING from "../services/student/studentOnboarding.service.js";

const companyId = (req: Request) => {
  if (!req.company) throw new AppError("Company context required", 400);
  return req.company.id;
};
const create = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_SERVICE.create(req.user, companyId(req), req.body, req.ip ?? "unknown"), 201);
const list = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_SERVICE.list(req.user, companyId(req), req.query as unknown as { page: number; limit: number; branchId?: string; departmentId?: string; status?: StudentStatus; search?: string }), 200);
const get = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_SERVICE.get(req.user, req.params.studentId, companyId(req)), 200);
const update = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_SERVICE.update(req.user, companyId(req), req.params.studentId, req.body), 200);
const status = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_SERVICE.setStatus(req.user, companyId(req), req.params.studentId, req.body.status, req.body.reason), 200);
const departments = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_SERVICE.replaceDepartments(req.user, companyId(req), req.params.studentId, req.body.departmentIds), 200);
const addDepartment = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_SERVICE.addDepartment(req.user, companyId(req), req.params.studentId, req.body.departmentId), 201);
const endDepartment = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_SERVICE.endDepartment(req.user, companyId(req), req.params.studentId, req.params.departmentId), 200);
const activities = async (req: Request, res: Response) => {
  const profile = await STUDENT_SERVICE.get(req.user, req.params.studentId, companyId(req));
  const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const [items, total] = await prisma.$transaction([prisma.studentActivity.findMany({ where: { studentId: profile.id, companyId: profile.companyId }, orderBy: { occurredAt: "desc" }, skip: (page - 1) * limit, take: limit }), prisma.studentActivity.count({ where: { studentId: profile.id, companyId: profile.companyId } })]);
  return successDataResponse(res, { items, total, page, limit }, 200);
};
const me = async (req: Request, res: Response) => {
  if (req.user.userRole !== "STUDENT") throw new AppError("Student account required", 403);
  const profile = await prisma.studentProfile.findFirst({ where: { userId: req.user.id, companyId: req.user.companyId ?? "" }, include: { user: { select: { id: true, name: true, email: true } }, memberships: { include: { department: true }, orderBy: { joinedAt: "desc" } } } });
  if (!profile) throw new AppError("Student profile not found", 404);
  return successDataResponse(res, profile, 200);
};
const meActivities = async (req: Request, res: Response) => {
  if (req.user.userRole !== "STUDENT") throw new AppError("Student account required", 403);
  const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) throw new AppError("Student profile not found", 404);
  const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const [items, total] = await prisma.$transaction([prisma.studentActivity.findMany({ where: { studentId: profile.id }, orderBy: { occurredAt: "desc" }, skip: (page - 1) * limit, take: limit }), prisma.studentActivity.count({ where: { studentId: profile.id } })]);
  return successDataResponse(res, { items, total, page, limit }, 200);
};
const updateMe = async (req: Request, res: Response) => {
  if (req.user.userRole !== "STUDENT") throw new AppError("Student account required", 403);
  const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile || profile.status !== "ACTIVE") throw new AppError("Active student profile required", 403);
  const { name, ...fields } = req.body as Record<string, unknown>;
  const updated = await prisma.$transaction(async (tx) => {
    if (typeof name === "string") await tx.user.update({ where: { id: req.user.id }, data: { name } });
    const value = await tx.studentProfile.update({ where: { id: profile.id }, data: fields });
    await tx.studentActivity.create({ data: { studentId: profile.id, companyId: profile.companyId, branchId: profile.branchId, actorId: req.user.id, type: "PROFILE_UPDATED", description: "Student updated their profile" } });
    return value;
  });
  return successDataResponse(res, updated, 200);
};
const myDepartments = async (req: Request, res: Response) => {
  if (req.user.userRole !== "STUDENT") throw new AppError("Student account required", 403);
  const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) throw new AppError("Student profile not found", 404);
  return successDataResponse(res, await prisma.studentDepartment.findMany({ where: { studentId: profile.id }, include: { department: true }, orderBy: { joinedAt: "desc" } }), 200);
};
const approve = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_SERVICE.setStatus(req.user, companyId(req), req.params.studentId, "ACTIVE"), 200);
const reject = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_SERVICE.setStatus(req.user, companyId(req), req.params.studentId, "REJECTED", req.body.reason), 200);
const assignStaff = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_SERVICE.assignStaff(req.user, companyId(req), req.body.userId, req.body.branchId, req.body.departmentId), 201);
const signup = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_ONBOARDING.registerWithAdmissionCode(req.body, req.ip ?? "unknown"), 201);
const createAdmissionCode = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_ONBOARDING.createAdmissionCode(req.user, companyId(req), req.body), 201);
const setSelfRegistration = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_ONBOARDING.setSelfRegistration(req.user, companyId(req), req.body.enabled), 200);
const revokeAdmissionCode = async (req: Request, res: Response) => successDataResponse(res, await STUDENT_ONBOARDING.revokeAdmissionCode(req.user, companyId(req), req.params.codeId), 200);
const studentController = { create, list, get, update, status, departments, addDepartment, endDepartment, activities, me, meActivities, updateMe, myDepartments, approve, reject, assignStaff, signup, createAdmissionCode, setSelfRegistration, revokeAdmissionCode };
export default studentController;
