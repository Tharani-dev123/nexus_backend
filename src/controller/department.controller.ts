import { Request, Response } from "express";

import {
  successDataResponse,
  successMessageResponse,
} from "../handlers/serverResponse.handler.js";

import DEPARTMENT_SERVICE from "../services/department/index.service.js";

import { CreateDepartmentInput } from "../schemas/department/createDepartment.schema.js";
import { UpdateDepartmentInput } from "../schemas/department/updateDepartment.schema.js";

const CreateDepartment = async (
  req: Request,
  res: Response,
) => {
  const body = req.body as CreateDepartmentInput;

  const company = req.company;

  const department =
    await DEPARTMENT_SERVICE.createDepartment(
      company,
      body,
    );

  return successDataResponse(
    res,
    department,
    201,
  );
};

const GetDepartmentById = async (
  req: Request,
  res: Response,
) => {
  const departmentId = req.query.id as string;

  const department =
    await DEPARTMENT_SERVICE.getDepartmentById(
      departmentId,
    );

  return successDataResponse(
    res,
    department,
    200,
  );
};

const GetDepartmentsByCompany = async (
  req: Request,
  res: Response,
) => {
  const company = req.company;

  const departments =
    await DEPARTMENT_SERVICE.getDepartmentsByCompany(
      company.id,
      req.query.branchId as string | undefined,
    );

  return successDataResponse(
    res,
    departments,
    200,
  );
};

const UpdateDepartment = async (
  req: Request,
  res: Response,
) => {
  const departmentId = req.query.id as string;

  const body = req.body as UpdateDepartmentInput;

  const department =
    await DEPARTMENT_SERVICE.updateDepartment(
      req.company.id,
      departmentId,
      body,
    );

  return successDataResponse(
    res,
    department,
    200,
  );
};

const DeleteDepartment = async (
  req: Request,
  res: Response,
) => {
  const departmentId = req.query.id as string;

  await DEPARTMENT_SERVICE.deleteDepartment(
    departmentId,
  );

  return successMessageResponse(
    res,
    "Department deleted successfully",
    200,
  );
};

const DEPARTMENT_CONTROLLER = {
  CreateDepartment,
  GetDepartmentById,
  GetDepartmentsByCompany,
  UpdateDepartment,
  DeleteDepartment,
};

export default DEPARTMENT_CONTROLLER;
