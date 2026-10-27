import prisma from "../../database/index.db.js";
import AUDIT_SERVICE from "../audit/index.service.js";
import { AUDIT_ENTITY } from "../../constants/audit/auditActions.constant.js";
import { AppError } from "../../types/AppError.js";
import { ReactivateSubscriptionInput } from "../../schemas/subscription/adminSubscription.schema.js";

export default async function reactivateSubscription(
  adminUserId: string,
  input: ReactivateSubscriptionInput,
) {
  const { companyId } = input;

  // 1. Verify company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId, deletedAt: null },
  });
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // 2. Find suspended or latest subscription
  const latestSub = await prisma.companySubscription.findFirst({
    where: { companyId },
    orderBy: { startDate: "desc" },
    include: { plan: true },
  });

  if (!latestSub) {
    throw new AppError("No subscription history found to reactivate", 400);
  }

  if (latestSub.status !== "SUSPENDED") {
    throw new AppError("Subscription is not suspended", 400);
  }

  const now = new Date();
  const hasExpired = latestSub.endDate !== null && latestSub.endDate < now;

  const result = await prisma.$transaction(async (tx) => {
    // If it has expired, status should become EXPIRED, otherwise ACTIVE
    const newStatus = hasExpired ? "EXPIRED" : "ACTIVE";
    const newIsActive = !hasExpired;

    const updatedSub = await tx.companySubscription.update({
      where: { id: latestSub.id },
      data: { isActive: newIsActive, status: newStatus },
      include: { plan: true },
    });

    // Record audit log
    await AUDIT_SERVICE.recordAudit({
      action: "REACTIVATE",
      entityType: AUDIT_ENTITY.COMPANY_SUBSCRIPTION,
      entityId: latestSub.id,
      companyId,
      userId: adminUserId,
      newValue: {
        entity: "SUBSCRIPTION",
        action: "REACTIVATE",
        companyId,
        planCode: latestSub.plan.code,
        performedBy: adminUserId,
        statusAfterReactivation: newStatus,
        notes: "Subscription reactivated by Super Admin",
      },
      tx,
    });

    return updatedSub;
  }, { maxWait: 5000, timeout: 15000 });

  return result;
}
