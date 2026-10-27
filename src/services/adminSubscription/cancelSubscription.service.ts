import prisma from "../../database/index.db.js";
import SUBSCRIPTION_REPO from "../../database/subscription/index.repo.js";
import AUDIT_SERVICE from "../audit/index.service.js";
import { AUDIT_ENTITY } from "../../constants/audit/auditActions.constant.js";
import { AppError } from "../../types/AppError.js";
import { CancelSubscriptionInput } from "../../schemas/subscription/adminSubscription.schema.js";

export default async function cancelSubscription(
  adminUserId: string,
  input: CancelSubscriptionInput,
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
    throw new AppError("No active subscription found to cancel", 400);
  }

  const now = new Date();

  // 3. Execute cancellation inside a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Deactivate subscription and update status to CANCELLED
    await tx.companySubscription.updateMany({
      where: { companyId, isActive: true },
      data: { isActive: false, endDate: now, status: "CANCELLED" },
    });

    // Disable all company modules that are currently enabled and get count
    const updateResult = await tx.companyModule.updateMany({
      where: { companyId, isEnabled: true },
      data: { isEnabled: false },
    });

    // Record audit log using generic AuditLog
    await AUDIT_SERVICE.recordAudit({
      action: "CANCEL",
      entityType: AUDIT_ENTITY.COMPANY_SUBSCRIPTION,
      entityId: activeSub.id,
      companyId,
      userId: adminUserId,
      newValue: {
        entity: "SUBSCRIPTION",
        action: "CANCEL",
        companyId,
        oldPlan: activeSub.plan.code,
        newPlan: null,
        oldEndDate: activeSub.endDate || null,
        newEndDate: null,
        performedBy: adminUserId,
        notes: reason || "Subscription manually cancelled by Super Admin",
      },
      tx,
    });

    return { disabledModulesCount: updateResult.count };
  }, { maxWait: 5000, timeout: 15000 });

  return result;
}
