import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export interface CreatePlanData {
  code: string;
  name: string;
  description?: string | null;
  monthlyPrice?: number;
  annualPrice?: number;
  isActive?: boolean;
}

export default async function createPlan(
  data: CreatePlanData,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.subscriptionPlan.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      monthlyPrice: data.monthlyPrice ?? 0,
      annualPrice: data.annualPrice ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}
