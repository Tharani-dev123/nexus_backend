import prisma from "../../database/index.db.js";
import SUBSCRIPTION_REPO from "../../database/subscription/index.repo.js";
import subscribeCompany from "../subscription/subscription/subscribeCompany.service.js";
import AUDIT_SERVICE from "../audit/index.service.js";
import { AUDIT_ENTITY } from "../../constants/audit/auditActions.constant.js";
import { AppError } from "../../types/AppError.js";
import { addMonths } from "./date.util.js";
import { ActivateSubscriptionInput } from "../../schemas/subscription/adminSubscription.schema.js";

export default async function activateSubscription(
  adminUserId: string,
  input: ActivateSubscriptionInput,
) {
  const {
    companyId,
    planCode,
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

  // 2. Verify plan exists
  const plan = await SUBSCRIPTION_REPO.getPlanByCode(planCode);
  if (!plan) {
    throw new AppError("Plan not found", 404);
  }
  if (!plan.isActive) {
    throw new AppError("This plan is not available", 400);
  }

  // 3. Check for duplicate activation
  const activeSub = await SUBSCRIPTION_REPO.getActiveSubscription(companyId);
  if (activeSub && activeSub.plan.code === planCode) {
    throw new AppError("Company already has an active subscription for this plan", 409);
  }

  // 4. Calculate duration
  const startDate = new Date();
  const endDate = addMonths(startDate, durationMonths);

  // 5. Execute transaction
  const subscription = await prisma.$transaction(async (tx) => {
    // Provision using the existing subscription engine
    await subscribeCompany(companyId, { planCode, startDate, endDate }, tx);

    // Fetch the subscription we just created within the transaction
    const createdSub = await tx.companySubscription.findFirst({
      where: { companyId, isActive: true },
      include: { plan: true },
    });

    if (!createdSub) {
      throw new AppError("Subscription activation failed", 500);
    }

    // Record the audit log in the generic AuditLog system
    await AUDIT_SERVICE.recordAudit({
      action: "ACTIVATE",
      entityType: AUDIT_ENTITY.COMPANY_SUBSCRIPTION,
      entityId: createdSub.id,
      companyId,
      userId: adminUserId,
      newValue: {
        entity: "SUBSCRIPTION",
        action: "ACTIVATE",
        companyId,
        oldPlan: activeSub?.plan.code || null,
        newPlan: planCode,
        paymentReference: paymentReference || null,
        paymentMode: paymentMode || null,
        amount: amount || null,
        currency: currency || null,
        invoiceNumber: invoiceNumber || null,
        durationMonths,
        performedBy: adminUserId,
        notes: notes || null,
      },
      tx,
    });

    return createdSub;
  }, { maxWait: 5000, timeout: 15000 });

  return subscription;
}
