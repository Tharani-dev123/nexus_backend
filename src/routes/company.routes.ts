import { Router } from "express";
import validateInput from "../middleware/inputValidator.middleware.js";
 import COMPANY_CONTROLLER from "../controller/company.controller.js";
import {createCompanySchema} from "../schemas/company/createCompany.schema.js";
import {updateCompanySchema} from "../schemas/company/updateCompany.schema.js";
import { inviteUserSchema } from "../schemas/company/inviteUser.schema.js";
import verifyCompanyRootAccess from "../middleware/company/authorizeCompanyRootAccess.middleware.js";
import authorizeCompanyAccess from "../middleware/company/authorizeCompanyAccess.middleware.js";
const companyRouter = Router();

companyRouter.post(
  "/create-company",
  validateInput(createCompanySchema),
  COMPANY_CONTROLLER.CreateCompany,
);

companyRouter.get(
  "/get-company",
  authorizeCompanyAccess,
  COMPANY_CONTROLLER.GetCompanyById,
);

companyRouter.patch(
  "/update-company",
  authorizeCompanyAccess,
  verifyCompanyRootAccess,
  validateInput(updateCompanySchema),
  COMPANY_CONTROLLER.UpdateCompany,
);

companyRouter.delete(
  "/delete-company",
  authorizeCompanyAccess,
  verifyCompanyRootAccess,
  COMPANY_CONTROLLER.DeleteCompany,
);

companyRouter.post(
  "/invite-user",
  authorizeCompanyAccess,
  verifyCompanyRootAccess,
  validateInput(inviteUserSchema),
  COMPANY_CONTROLLER.InviteUser,
);

export default companyRouter;