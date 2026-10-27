import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

/**
 * Closes out a company's currently-active subscriptions (single active plan at
 * a time). Called inside the activation transaction before the new one is
 * created so switching plans is atomic.
 */
export default async function deactivateActiveSubscriptions(
  companyId: string,
  endDate: Date,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.companySubscription.updateMany({
    where: { companyId, isActive: true },
    data: { isActive: false, endDate, status: "EXPIRED" },
  });
}
