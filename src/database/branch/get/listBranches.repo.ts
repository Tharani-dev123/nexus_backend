import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";
import { SortOrder } from "../../../utils/query.util.js";

export interface ListBranchesFilter {
  companyId: string;
  search?: string | null;
  includeInactive?: boolean;
  orderBy: Record<string, SortOrder>;
  skip: number;
  take: number;
}

function buildWhere(filter: ListBranchesFilter): Prisma.BranchWhereInput {
  const where: Prisma.BranchWhereInput = {
    companyId: filter.companyId,
    deletedAt: null,
  };
  if (!filter.includeInactive) where.isActive = true;
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { code: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  return where;
}

export default async function listBranches(
  filter: ListBranchesFilter,
  tx: Prisma.TransactionClient = prisma,
) {
  const where = buildWhere(filter);
  const [items, total] = await Promise.all([
    tx.branch.findMany({
      where,
      orderBy: filter.orderBy,
      skip: filter.skip,
      take: filter.take,
    }),
    tx.branch.count({ where }),
  ]);
  return { items, total };
}
