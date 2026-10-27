import { UserRole } from "@prisma/client";
import SUBSCRIPTION_SERVICE from "../../subscription/index.service.js";
import { ModuleAccessContext } from "../../subscription/access/getModuleAccessContext.service.js";

/**
 * Resolves the subscription / module-access block attached to login responses.
 * Returns `null` for users not yet bound to a company (e.g. just-registered
 * owners before company creation).
 */
export default async function buildLoginAccess(
  companyId: string | null | undefined,
  userRole?: UserRole,
): Promise<ModuleAccessContext | null> {
  if (!companyId) return null;
  return SUBSCRIPTION_SERVICE.getModuleAccessContext(companyId, userRole);
}
