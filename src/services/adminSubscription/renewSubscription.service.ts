import prisma from "../../database/index.db.js";
import SUBSCRIPTION_REPO from "../../database/subscription/index.repo.js";
import subscribeCompany from "../subscription/subscription/subscribeCompany.service.js";
import AUDIT_SERVICE from "../audit/index.service.js";
import { AUDIT_ENTITY } from "../../constants/audit/auditActions.constant.js";
import { AppError } from "../../types/AppError.js";
import { addMonths } from "./date.util.js";
import { RenewSubscriptionInput } from "../../schemas/subscription/adminSubscription.schema.js";

export default async function renewSubscription(
  adminUserId: string,
  input: RenewSubscriptionInput,
) {
  const {
    companyId,
    durationMonths,
    paymentReference,
    paymentMode,
    amount,
    currency,
    invoiceNumber,
    notes,
  } = input;

  // 1. Verify company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId, deletedAt: null },
  });
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // 2. Check current active subscription
  const activeSub = await SUBSCRIPTION_REPO.getActiveSubscription(companyId);
  const now = new Date();
  const isCurrentlyActive =
    activeSub &&
    activeSub.isActive &&
    activeSub.status === "ACTIVE" &&
    (activeSub.endDate === null || activeSub.endDate > now);

  if (isCurrentlyActive && activeSub) {
    // Extend current subscription end date
    const oldEndDate = activeSub.endDate;
    const newEndDate = oldEndDate ? addMonths(oldEndDate, durationMonths) : addMonths(now, durationMonths);

    const subscription = await prisma.$transaction(async (tx) => {
      const updatedSub = await tx.companySubscription.update({
        where: { id: activeSub.id },
        data: { endDate: newEndDate },
        include: { plan: true },
      });

      // Record generic audit log
      await AUDIT_SERVICE.recordAudit({
        action: "RENEW",
        entityType: AUDIT_ENTITY.COMPANY_SUBSCRIPTION,
        entityId: activeSub.id,
        companyId,
        userId: adminUserId,
        newValue: {
          entity: "SUBSCRIPTION",
          action: "RENEW",
          companyId,
          oldPlan: activeSub.plan.code,
          newPlan: activeSub.plan.code,
          oldEndDate: oldEndDate || null,
          newEndDate,
          durationMonths,
          performedBy: adminUserId,
          paymentReference: paymentReference || null,
          paymentMode: paymentMode || null,
          amount: amount || null,
          currency: currency || null,
          invoiceNumber: invoiceNumber || null,
          notes: notes || null,
        },
        tx,
      });

      return updatedSub;
    }, { maxWait: 5000, timeout: 15000 });

    return { endDate: subscription.endDate };
  } else {
    // Fetch last subscription history to identify the plan to renew/reactivate
    const lastSub = await prisma.companySubscription.findFirst({
      where: { companyId },
      orderBy: { startDate: "desc" },
      include: { plan: true },
    });

    if (!lastSub) {
      throw new AppError(
        "No previous subscription found to renew. Please activate a new subscription.",
        400,
      );
    }

    const startDate = now;
    const endDate = addMonths(startDate, durationMonths);

    const subscription = await prisma.$transaction(async (tx) => {
      // Use existing provisioning service to create new active subscription
      await subscribeCompany(companyId, { planCode: lastSub.plan.code, startDate, endDate }, tx);

      const createdSub = await tx.companySubscription.findFirst({
        where: { companyId, isActive: true },
        include: { plan: true },
      });

      if (!createdSub) {
        throw new AppError("Subscription renewal reactivation failed", 500);
      }

      // Record generic audit log
      await AUDIT_SERVICE.recordAudit({
        action: "RENEW",
        entityType: AUDIT_ENTITY.COMPANY_SUBSCRIPTION,
        entityId: createdSub.id,
        companyId,
        userId: adminUserId,
        newValue: {
          entity: "SUBSCRIPTION",
          action: "RENEW",
          companyId,
          oldPlan: lastSub.plan.code,
          newPlan: lastSub.plan.code,
          oldEndDate: lastSub.endDate || null,
          newEndDate: endDate,
          durationMonths,
          performedBy: adminUserId,
          paymentReference: paymentReference || null,
          paymentMode: paymentMode || null,
          amount: amount || null,
          currency: currency || null,
          invoiceNumber: invoiceNumber || null,
          notes: notes || null,
        },
        tx,
      });

      return createdSub;
    }, { maxWait: 5000, timeout: 15000 });

    return { endDate: subscription.endDate };
  }
}
