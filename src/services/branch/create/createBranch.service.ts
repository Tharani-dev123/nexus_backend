import BRANCH_REPO from "../../../database/branch/index.repo.js";
import AUDIT_SERVICE from "../../audit/index.service.js";
import { AUDIT_ACTION, AUDIT_ENTITY } from "../../../constants/audit/auditActions.constant.js";
import { CreateBranchInput } from "../../../schemas/branch/createBranch.schema.js";

export default async function createBranch(
  companyId: string,
  input: CreateBranchInput,
) {
  const branch = await BRANCH_REPO.createBranch({ companyId, ...input });

  await AUDIT_SERVICE.recordAudit({
    action: AUDIT_ACTION.CREATED,
    entityType: AUDIT_ENTITY.BRANCH,
    entityId: branch.id,
    newValue: branch,
  });

  return branch;
}
