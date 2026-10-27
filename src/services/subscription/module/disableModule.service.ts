import { ProductModule } from "@prisma/client";
import SUBSCRIPTION_REPO from "../../../database/subscription/index.repo.js";
import AUDIT_SERVICE from "../../audit/index.service.js";
import { AppError } from "../../../types/AppError.js";
import { isProductModule } from "../../../constants/subscription/modules.constant.js";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY,
} from "../../../constants/audit/auditActions.constant.js";

/** Disables a single module for a company (visibility off, history retained). */
export default async function disableModule(
  companyId: string,
  moduleCode: string,
) {
  if (!isProductModule(moduleCode)) {
    throw new AppError(`Unknown module code: ${moduleCode}`, 400);
  }

  const existing = await SUBSCRIPTION_REPO.getCompanyModule(
    companyId,
    moduleCode as ProductModule,
  );
  if (!existing) {
    throw new AppError("This module is not provisioned for the company", 404);
  }

  const row = await SUBSCRIPTION_REPO.setModuleEnabled(
    companyId,
    moduleCode as ProductModule,
    false,
  );

  await AUDIT_SERVICE.recordAudit({
    action: AUDIT_ACTION.DISABLED,
    entityType: AUDIT_ENTITY.COMPANY_MODULE,
    entityId: row.id,
    newValue: { moduleCode, isEnabled: false },
  });

  return row;
}
