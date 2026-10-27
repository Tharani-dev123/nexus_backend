import { Request, Response } from "express";
import { successDataResponse } from "../handlers/serverResponse.handler.js";
import { getCompanySettings, updateCompanySettings } from "../services/setting/index.service.js";

const GetSettings = async (req: Request, res: Response) => {
  const company = req.company;
  const settings = await getCompanySettings(company.id);
  return successDataResponse(res, settings, 200);
};

const UpdateSettings = async (req: Request, res: Response) => {
  const company = req.company;
  const body = req.body;
  const settings = await updateCompanySettings(company.id, body);
  return successDataResponse(res, settings, 200);
};

const SETTINGS_CONTROLLER = {
  GetSettings,
  UpdateSettings,
};

export default SETTINGS_CONTROLLER;
