import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export interface ListPlansFilter {
  includeInactive?: boolean;
}

export default async function listPlans(
  filter: ListPlansFilter = {},
  tx: Prisma.TransactionClient = prisma,
) {
  const where: Prisma.SubscriptionPlanWhereInput = {};
  if (!filter.includeInactive) where.isActive = true;

  return tx.subscriptionPlan.findMany({
    where,
    orderBy: { monthlyPrice: "asc" },
  });
}
