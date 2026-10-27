import { ProductModule } from "@prisma/client";
import SUBSCRIPTION_REPO from "../../../database/subscription/index.repo.js";
import AUDIT_SERVICE from "../../audit/index.service.js";
import { AppError } from "../../../types/AppError.js";
import { isProductModule } from "../../../constants/subscription/modules.constant.js";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY,
} from "../../../constants/audit/auditActions.constant.js";

/** Enables (or re-enables) a single module for a company — an add-on / override. */
export default async function enableModule(
  companyId: string,
  moduleCode: string,
) {
  if (!isProductModule(moduleCode)) {
    throw new AppError(`Unknown module code: ${moduleCode}`, 400);
  }

  const row = await SUBSCRIPTION_REPO.upsertCompanyModule({
    companyId,
    moduleCode: moduleCode as ProductModule,
    isEnabled: true,
  });

  await AUDIT_SERVICE.recordAudit({
    action: AUDIT_ACTION.ENABLED,
    entityType: AUDIT_ENTITY.COMPANY_MODULE,
    entityId: row.id,
    newValue: { moduleCode, isEnabled: true },
  });

  return row;
}
