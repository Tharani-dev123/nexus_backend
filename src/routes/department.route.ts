import { Router } from "express";

import validateInput from "../middleware/inputValidator.middleware.js";

import DEPARTMENT_CONTROLLER from "../controller/department.controller.js";

import { createDepartmentSchema } from "../schemas/department/createDepartment.schema.js";
import { updateDepartmentSchema } from "../schemas/department/updateDepartment.schema.js";

import authorizeCompanyAccess from "../middleware/company/authorizeCompanyAccess.middleware.js";
import verifyCompanyRootAccess from "../middleware/company/authorizeCompanyRootAccess.middleware.js";

const departmentRouter = Router();

departmentRouter.post(
  "/create-department",
  
  verifyCompanyRootAccess,
  validateInput(createDepartmentSchema),
  DEPARTMENT_CONTROLLER.CreateDepartment,
);

departmentRouter.get(
  "/get-departments",
  
  DEPARTMENT_CONTROLLER.GetDepartmentsByCompany,
);

departmentRouter.get(
  "/get-department-by-id",
  
  DEPARTMENT_CONTROLLER.GetDepartmentById,
);

departmentRouter.patch(
  "/update-department",
  
  verifyCompanyRootAccess,
  validateInput(updateDepartmentSchema),
  DEPARTMENT_CONTROLLER.UpdateDepartment,
);

departmentRouter.delete(
  "/delete-department",
  
  verifyCompanyRootAccess,
  DEPARTMENT_CONTROLLER.DeleteDepartment,
);

export default departmentRouter;