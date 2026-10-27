import { Prisma } from "@prisma/client";
import prisma from "../../database/index.db.js";
import getBranchById from "../../database/branch/get/getBranchById.repo.js";
import { AppError } from "../../types/AppError.js";

/**
 * Guards against cross-tenant branch references. Returns silently when branchId
 * is null/undefined (company-wide). Throws 404 when the branch does not belong
 * to the company.
 */
export default async function assertBranchInCompany(
  companyId: string,
  branchId: string | null | undefined,
  tx: Prisma.TransactionClient = prisma,
): Promise<void> {
  if (!branchId) return;
  const branch = await getBranchById(branchId, companyId, tx);
  if (!branch) throw new AppError("Branch not found for this company", 404);
}
