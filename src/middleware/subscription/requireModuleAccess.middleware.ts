import { Request, Response, NextFunction } from "express";
import { ProductModule } from "@prisma/client";
import { AppError } from "../../types/AppError.js";
import SUBSCRIPTION_SERVICE from "../../services/subscription/index.service.js";
import { isProductModule } from "../../constants/subscription/modules.constant.js";

/**
 * Gates a route behind a purchased/enabled module. Mount AFTER `authenticateUser`
 * and `authorizeCompanyAccess` so `req.company` is resolved:
 *
 *   router.use(
 *     authenticateUser,
 *     authorizeCompanyAccess,
 *     requireModuleAccess("COMPLIANCE"),
 *   );
 *
 * Fail-closed: any company without the enabled module gets a 403.
 */
export default function requireModuleAccess(moduleCode: ProductModule) {
  if (!isProductModule(moduleCode)) {
    // Misconfiguration — surface loudly at route-registration call sites.
    throw new Error(`requireModuleAccess: unknown module code "${moduleCode}"`);
  }

  return async (req: Request, _res: Response, next: NextFunction) => {
    const company = req.company;
    if (!company) {
      throw new AppError(
        "Company context is required for module access checks",
        400,
      );
    }

    await SUBSCRIPTION_SERVICE.assertModuleEnabled(company.id, moduleCode);

    return next();
  };
}
