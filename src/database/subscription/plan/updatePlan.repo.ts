import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export interface UpdatePlanData {
  name?: string;
  description?: string | null;
  monthlyPrice?: number;
  annualPrice?: number;
  isActive?: boolean;
}

export default async function updatePlan(
  id: string,
  data: UpdatePlanData,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.subscriptionPlan.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.monthlyPrice !== undefined ? { monthlyPrice: data.monthlyPrice } : {}),
      ...(data.annualPrice !== undefined ? { annualPrice: data.annualPrice } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}
