import { Request, Response } from "express";

import {
  successDataResponse,
  successMessageResponse,
} from "../handlers/serverResponse.handler.js";

import COMPANY_SERVICE from "../services/company/index.service.js";
import USER_INVITE_SERVICE from "../services/userInvite/index.service.js";

import { CreateCompanyInput } from "../schemas/company/createCompany.schema.js";
import { CompanyUpdateInput } from "../schemas/company/updateCompany.schema.js";
import { InviteUserInput } from "../schemas/company/inviteUser.schema.js";

const CreateCompany = async (
  req: Request,
  res: Response,
) => {
  const body = req.body as CreateCompanyInput;
  const user = req.user;
  const company = await COMPANY_SERVICE.createCompany(body,user);

  return successDataResponse(res, company, 201);
};

const GetCompanyById = async (
  req: Request,
  res: Response,
) => {
  const companyId = req.query.companyId as string;

  const company =
    await COMPANY_SERVICE.getCompanyById(companyId);

  return successDataResponse(res, company, 200);
};

const UpdateCompany = async (
  req: Request,
  res: Response,
) => {
  const companyId = req.query.companyId as string;

  const body = req.body as CompanyUpdateInput;

  const company =
    await COMPANY_SERVICE.updateCompany(
      companyId,
      body,
    );

  return successDataResponse(res, company, 200);
};

const DeleteCompany = async (
  req: Request,
  res: Response,
) => {
  const companyId = req.query.companyId as string;

  await COMPANY_SERVICE.deleteCompany(companyId);

  return successMessageResponse(
    res,
    "Company deleted successfully",
    200,
  );
};

const InviteUser = async (
  req: Request,
  res: Response,
) => {
  const company = req.company;

  const body = req.body as InviteUserInput;

  const invite = await USER_INVITE_SERVICE.createUserInvite(
    company.id,
    body,
  );

  return successDataResponse(res, invite, 201);
};

const COMPANY_CONTROLLER = {
  CreateCompany,
  GetCompanyById,
  UpdateCompany,
  DeleteCompany,
  InviteUser,
};

export default COMPANY_CONTROLLER;