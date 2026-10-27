import { Request, Response, NextFunction } from "express";
import { AppError } from "../../types/AppError.js";
import prisma from "../../database/index.db.js";
import { requestContext } from "../../context/requestContext.js";

export default async function authorizeCompanyAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const companyId = req.query.companyId as string;

  if (!companyId) {
    throw new AppError("Company ID is required", 400);
  }

  const user = req.user;

  if (!user) {
    throw new AppError("Unauthorized", 401);
  }

  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      deletedAt: null,
    },
  });

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // Root user OR company member
  const hasAccess =
    company.rootUserId === user.id ||
    user.companyId === companyId;

  if (!hasAccess) {
    throw new AppError(
      "Forbidden: You don't have access to this company",
      403,
    );
  }

  req.company = company;

  const store = requestContext.getStore();

  if (store) {
    store.company_id = company.id;
  }

  return next();
}