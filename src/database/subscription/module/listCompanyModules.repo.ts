import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export interface ListCompanyModulesFilter {
  /** When true, returns disabled rows too (admin view). */
  includeDisabled?: boolean;
}

export default async function listCompanyModules(
  companyId: string,
  filter: ListCompanyModulesFilter = {},
  tx: Prisma.TransactionClient = prisma,
) {
  const where: Prisma.CompanyModuleWhereInput = { companyId };
  if (!filter.includeDisabled) where.isEnabled = true;

  return tx.companyModule.findMany({
    where,
    orderBy: { activatedAt: "asc" },
  });
}
