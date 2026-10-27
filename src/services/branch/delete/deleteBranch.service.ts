import BRANCH_REPO from "../../../database/branch/index.repo.js";
import AUDIT_SERVICE from "../../audit/index.service.js";
import { AppError } from "../../../types/AppError.js";
import { AUDIT_ACTION, AUDIT_ENTITY } from "../../../constants/audit/auditActions.constant.js";

export default async function deleteBranch(companyId: string, id: string) {
  const existing = await BRANCH_REPO.getBranchById(id, companyId);
  if (!existing) throw new AppError("Branch not found", 404);

  await BRANCH_REPO.softDeleteBranch(id);

  await AUDIT_SERVICE.recordAudit({
    action: AUDIT_ACTION.DELETED,
    entityType: AUDIT_ENTITY.BRANCH,
    entityId: id,
    oldValue: existing,
  });
}
