import BRANCH_REPO from "../../../database/branch/index.repo.js";
import { AppError } from "../../../types/AppError.js";

export default async function getBranchById(companyId: string, id: string) {
  const branch = await BRANCH_REPO.getBranchById(id, companyId);
  if (!branch) throw new AppError("Branch not found", 404);
  return branch;
}
