import prisma from "../../database/index.db.js";
import SUBSCRIPTION_REPO from "../../database/subscription/index.repo.js";
import subscribeCompany from "../subscription/subscription/subscribeCompany.service.js";
import AUDIT_SERVICE from "../audit/index.service.js";
import { AUDIT_ENTITY } from "../../constants/audit/auditActions.constant.js";
import { AppError } from "../../types/AppError.js";
import { ChangePlanSubscriptionInput } from "../../schemas/subscription/adminSubscription.schema.js";

export default async function changePlanSubscription(
  adminUserId: string,
  input: ChangePlanSubscriptionInput,
) {
  const { companyId, planCode, reason } = input;

  // 1. Verify company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId, deletedAt: null },
  });
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // 2. Verify plan exists and is active
  const targetPlan = await SUBSCRIPTION_REPO.getPlanByCode(planCode);
  if (!targetPlan) {
    throw new AppError("Target plan not found", 404);
  }
  if (!targetPlan.isActive) {
    throw new AppError("Target plan is not active", 400);
  }

  // 3. Get current active subscription
  const activeSub = await SUBSCRIPTION_REPO.getActiveSubscription(companyId);
  if (!activeSub) {
    throw new AppError("No active subscription found to upgrade or downgrade. Please activate one first.", 400);
  }

  if (activeSub.plan.code === planCode) {
    throw new AppError("Company is already subscribed to this plan", 400);
  }

  const now = new Date();

  // 4. Provision plan change inside a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Call subscribeCompany to archive old subscription and create the new one
    await subscribeCompany(
      companyId,
      {
        planCode,
        startDate: now,
        endDate: activeSub.endDate || undefined, // Preserve existing expiry date
      },
      tx,
    );

    const createdSub = await tx.companySubscription.findFirst({
      where: { companyId, isActive: true },
      include: { plan: true },
    });

    if (!createdSub) {
      throw new AppError("Plan change provisioning failed", 500);
    }

    // Record the CHANGE_PLAN audit log
    await AUDIT_SERVICE.recordAudit({
      action: "CHANGE_PLAN",
      entityType: AUDIT_ENTITY.COMPANY_SUBSCRIPTION,
      entityId: createdSub.id,
      companyId,
      userId: adminUserId,
      newValue: {
        entity: "SUBSCRIPTION",
        action: "CHANGE_PLAN",
        companyId,
        oldPlan: activeSub.plan.code,
        newPlan: planCode,
        startDate: now,
        endDate: activeSub.endDate || null,
        performedBy: adminUserId,
        notes: reason,
      },
      tx,
    });

    return createdSub;
  }, { maxWait: 5000, timeout: 15000 });

  return result;
}
