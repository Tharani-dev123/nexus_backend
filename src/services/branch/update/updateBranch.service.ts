import { Prisma } from "@prisma/client";
import BRANCH_REPO from "../../../database/branch/index.repo.js";
import AUDIT_SERVICE from "../../audit/index.service.js";
import { AppError } from "../../../types/AppError.js";
import { AUDIT_ACTION, AUDIT_ENTITY } from "../../../constants/audit/auditActions.constant.js";
import { UpdateBranchInput } from "../../../schemas/branch/updateBranch.schema.js";

export default async function updateBranch(
  companyId: string,
  id: string,
  input: UpdateBranchInput,
) {
  const existing = await BRANCH_REPO.getBranchById(id, companyId);
  if (!existing) throw new AppError("Branch not found", 404);

  const data: Prisma.BranchUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.code !== undefined) data.code = input.code;
  if (input.addressLine !== undefined) data.addressLine = input.addressLine;
  if (input.city !== undefined) data.city = input.city;
  if (input.state !== undefined) data.state = input.state;
  if (input.country !== undefined) data.country = input.country;
  if (input.pinCode !== undefined) data.pinCode = input.pinCode;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const updated = await BRANCH_REPO.updateBranch(id, data);

  await AUDIT_SERVICE.recordAudit({
    action: AUDIT_ACTION.UPDATED,
    entityType: AUDIT_ENTITY.BRANCH,
    entityId: id,
    oldValue: existing,
    newValue: updated,
  });

  return updated;
}
