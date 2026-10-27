import { Request, Response, NextFunction } from "express";
import { AppError } from "../../types/AppError.js";

export default async function verifyCompanyRootAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user;

  if (!user) {
    throw new AppError("Unauthorized", 401);
  }

  if (!user.companyId) {
    throw new AppError("You are not associated with any company", 403);
  }

  const company = req.company;

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  if (company.rootUserId !== user.id) {
    throw new AppError(
      "Forbidden: Only the company owner can perform this action",
      403,
    );
  }

  return next();
}