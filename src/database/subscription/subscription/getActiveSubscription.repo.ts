import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

/** The company's current active subscription (most recently started), if any. */
export default async function getActiveSubscription(
  companyId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.companySubscription.findFirst({
    where: { companyId, isActive: true },
    orderBy: { startDate: "desc" },
    include: { plan: true },
  });
}
