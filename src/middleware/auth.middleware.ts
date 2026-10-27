import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/AppError.js";
import { requestContext } from "../context/requestContext.js";
import AUTH_SERVICE from "../services/auth/index.service.js";
import USER_SERVICE from "../services/user/index.service.js";
import COMPANY_SERVICE from "../services/company/index.service.js";

export default async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.header("authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new AppError("Unauthorized", 401);
  }

  const decoded = AUTH_SERVICE.ACCESS_TOKEN.verifyToken(token);

  await AUTH_SERVICE.REFRESH_TOKEN.checkRefreshTokenById(
    decoded.rftoken_id,
    decoded.user_id,
  );

  const user = await USER_SERVICE.getUserById(decoded.user_id);

  let company = null;

  if (user.companyId) {
    try {
      company = await COMPANY_SERVICE.getCompanyById(user.companyId);
    } catch (error) {
      // Ignore missing company
      if (
        error instanceof AppError &&
        error.status === 404
      ) {
        company = null;
      } else {
        throw error;
      }
    }
  }

  req.user = user;
  req.company = company;
  req.auth = {
    rftoken_id: decoded.rftoken_id,
  };

  const store = requestContext.getStore();

  if (store) {
    store.user_id = user.id;

    if (company) {
      store.company_id = company.id;
    }
  }

  return next();
}