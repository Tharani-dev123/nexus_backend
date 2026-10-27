import prisma from "../../database/index.db.js";
import SUBSCRIPTION_REPO from "../../database/subscription/index.repo.js";
import AUDIT_SERVICE from "../audit/index.service.js";
import { AUDIT_ENTITY } from "../../constants/audit/auditActions.constant.js";
import { AppError } from "../../types/AppError.js";
import { SuspendSubscriptionInput } from "../../schemas/subscription/adminSubscription.schema.js";

export default async function suspendSubscription(
  adminUserId: string,
  input: SuspendSubscriptionInput,
) {
  const { companyId, reason } = input;

  // 1. Verify company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId, deletedAt: null },
  });
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // 2. Check active subscription
  const activeSub = await SUBSCRIPTION_REPO.getActiveSubscription(companyId);
  if (!activeSub) {
    throw new AppError("No active subscription found to suspend", 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    // Deactivate and set status to SUSPENDED
    const updatedSub = await tx.companySubscription.update({
      where: { id: activeSub.id },
      data: { isActive: false, status: "SUSPENDED" },
      include: { plan: true },
    });

    // Record audit log
    await AUDIT_SERVICE.recordAudit({
      action: "SUSPEND",
      entityType: AUDIT_ENTITY.COMPANY_SUBSCRIPTION,
      entityId: activeSub.id,
      companyId,
      userId: adminUserId,
      newValue: {
        entity: "SUBSCRIPTION",
        action: "SUSPEND",
        companyId,
        oldPlan: activeSub.plan.code,
        performedBy: adminUserId,
        notes: reason,
      },
      tx,
    });

    return updatedSub;
  }, { maxWait: 5000, timeout: 15000 });

  return result;
}
