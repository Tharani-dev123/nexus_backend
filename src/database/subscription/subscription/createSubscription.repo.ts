import { Prisma, SubscriptionStatus } from "@prisma/client";
import prisma from "../../index.db.js";

export interface CreateSubscriptionData {
  companyId: string;
  planId: string;
  startDate?: Date;
  endDate?: Date | null;
  isActive?: boolean;
  status?: SubscriptionStatus;
}

export default async function createSubscription(
  data: CreateSubscriptionData,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.companySubscription.create({
    data: {
      companyId: data.companyId,
      planId: data.planId,
      startDate: data.startDate ?? new Date(),
      endDate: data.endDate ?? null,
      isActive: data.isActive ?? true,
      status: data.status ?? "ACTIVE",
    },
    include: { plan: true },
  });
}
