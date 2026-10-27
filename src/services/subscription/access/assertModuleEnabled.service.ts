import { ProductModule } from "@prisma/client";
import SUBSCRIPTION_REPO from "../../../database/subscription/index.repo.js";
import { AppError } from "../../../types/AppError.js";

/**
 * Fail-closed module gate used by the requireModuleAccess middleware. Throws a
 * 403 carrying the offending module code when the company has not purchased /
 * enabled it.
 */
export default async function assertModuleEnabled(
  companyId: string,
  moduleCode: ProductModule,
): Promise<void> {
  const row = await SUBSCRIPTION_REPO.getCompanyModule(companyId, moduleCode);

  if (!row || !row.isEnabled) {
    throw new AppError(
      `Forbidden: the ${moduleCode} module is not enabled for this company`,
      403,
      {},
      { moduleCode, reason: "MODULE_NOT_ENABLED" },
    );
  }
}
