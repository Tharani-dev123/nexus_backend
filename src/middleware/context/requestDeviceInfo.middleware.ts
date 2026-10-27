import { NextFunction, Request, Response } from "express";
import { UAParser } from "ua-parser-js";
import { requestContext } from "../../context/requestContext.js";

export default async function RequestDeviceInfoParser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parser = new UAParser(req.headers["user-agent"]);

  const result = parser.getResult();

  const deviceDetails = {
    browser: result.browser,
    os: result.os,
    device: result.device,
    cpu: result.cpu,
    userAgent: req.headers["user-agent"],
  };

  const store = requestContext.getStore();
  if (store) store.userDeviceDetails = deviceDetails;

  next();
}
