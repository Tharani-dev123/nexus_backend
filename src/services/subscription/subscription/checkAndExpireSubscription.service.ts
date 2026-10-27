import prisma from "../../../database/index.db.js";
import SUBSCRIPTION_REPO from "../../../database/subscription/index.repo.js";
import AUDIT_SERVICE from "../../audit/index.service.js";
import { AUDIT_ENTITY } from "../../../constants/audit/auditActions.constant.js";
import { Prisma } from "@prisma/client";

/**
 * Checks if the company's active subscription is past its end date.
 * If expired, it atomically deactivates the subscription, sets status to EXPIRED,
 * disables all company modules, logs the event to AuditLog, and returns null.
 * Otherwise, returns the active subscription.
 */
export default async function checkAndExpireSubscription(
  companyId: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx || prisma;

  // 1. Fetch active subscription
  const activeSub = await client.companySubscription.findFirst({
    where: { companyId, isActive: true },
    orderBy: { startDate: "desc" },
    include: { plan: true, company: true },
  });

  if (!activeSub) {
    return null;
  }

  const now = new Date();
  const isExpired = activeSub.endDate !== null && activeSub.endDate < now;

  if (isExpired) {
    // 2. Perform expiration inside transaction
    const execute = async (transaction: Prisma.TransactionClient) => {
      // Deactivate subscription
      await transaction.companySubscription.update({
        where: { id: activeSub.id },
        data: { isActive: false, status: "EXPIRED" },
      });

      // Disable all company modules
      await transaction.companyModule.updateMany({
        where: { companyId },
        data: { isEnabled: false },
      });

      // Write generic AuditLog entry
      await AUDIT_SERVICE.recordAudit({
        action: "EXPIRE",
        entityType: AUDIT_ENTITY.COMPANY_SUBSCRIPTION,
        entityId: activeSub.id,
        companyId,
        userId: activeSub.company.rootUserId || "SYSTEM",
        newValue: {
          entity: "SUBSCRIPTION",
          action: "EXPIRE",
          companyId,
          planCode: activeSub.plan.code,
          endDate: activeSub.endDate,
          notes: "Subscription automatically expired due to end date check",
        },
        tx: transaction,
      });
    };

    if (tx) {
      await execute(tx);
    } else {
      await prisma.$transaction(execute);
    }

    return null;
  }

  return activeSub;
}
