import { Request, Response } from "express";

import { successMessageResponse } from "../handlers/serverResponse.handler.js";
import getConfigValue from "../config/index.config.js";

export const welcome = (req: Request, res: Response) => {
  return successMessageResponse(
    res,
    `Welcome to the ${getConfigValue("SERVICE_NAME", "Auth")} server`,
    200,
  );
};

export const healthCheck = (req: Request, res: Response) => {
  return successMessageResponse(res, "OK", 200);
};
