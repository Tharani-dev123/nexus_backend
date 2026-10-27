import { Prisma } from "@prisma/client";
import prisma from "../../../database/index.db.js";
import SUBSCRIPTION_REPO from "../../../database/subscription/index.repo.js";
import AUDIT_SERVICE from "../../audit/index.service.js";
import getModuleAccessContext, {
  ModuleAccessContext,
} from "../access/getModuleAccessContext.service.js";
import { AppError } from "../../../types/AppError.js";
import { modulesForPlan } from "../../../constants/subscription/plans.constant.js";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY,
} from "../../../constants/audit/auditActions.constant.js";
import { SubscribeInput } from "../../../schemas/subscription/subscribe.schema.js";

/**
 * Activates a plan for a company and provisions exactly its module set:
 *   1. closes any currently-active subscription,
 *   2. records the new CompanySubscription,
 *   3. syncs CompanyModule rows to the plan's modules — enabling the plan's
 *      modules and disabling any previously-enabled module not in the new plan.
 *
 * Module grants are resolved from PLAN_MODULES (configuration-driven), keyed on
 * the stored plan's `code`.
 */
export default async function subscribeCompany(
  companyId: string,
  input: SubscribeInput,
  tx?: Prisma.TransactionClient,
): Promise<ModuleAccessContext> {
  const plan = await SUBSCRIPTION_REPO.getPlanByCode(input.planCode, tx);
  if (!plan) throw new AppError(`Unknown plan code: ${input.planCode}`, 404);
  if (!plan.isActive) throw new AppError("This plan is not available", 400);

  const planModules = modulesForPlan(plan.code);
  if (!planModules) {
    throw new AppError(
      `Plan ${plan.code} has no module mapping configured`,
      500,
    );
  }
  const target = new Set(planModules);

  const now = new Date();
  const startDate = input.startDate ? new Date(input.startDate) : now;
  const endDate = input.endDate ? new Date(input.endDate) : null;

  const execute = async (transaction: Prisma.TransactionClient) => {
    await SUBSCRIPTION_REPO.deactivateActiveSubscriptions(companyId, now, transaction);

    await SUBSCRIPTION_REPO.createSubscription(
      { companyId, planId: plan.id, startDate, endDate },
      transaction,
    );

    // Enable the plan's modules.
    for (const moduleCode of planModules) {
      await SUBSCRIPTION_REPO.upsertCompanyModule(
        { companyId, moduleCode, isEnabled: true },
        transaction,
      );
    }

    // Disable anything currently enabled that the new plan does not include.
    const current = await SUBSCRIPTION_REPO.listCompanyModules(
      companyId,
      { includeDisabled: false },
      transaction,
    );
    for (const row of current) {
      if (!target.has(row.moduleCode)) {
        await SUBSCRIPTION_REPO.setModuleEnabled(
          companyId,
          row.moduleCode,
          false,
          transaction,
        );
      }
    }
  };

  if (tx) {
    await execute(tx);
  } else {
    await prisma.$transaction(execute);
  }

  await AUDIT_SERVICE.recordAudit({
    action: AUDIT_ACTION.SUBSCRIBED,
    entityType: AUDIT_ENTITY.COMPANY_SUBSCRIPTION,
    entityId: companyId,
    newValue: { planCode: plan.code, modules: planModules, startDate, endDate },
    tx,
  });

  return getModuleAccessContext(companyId, undefined, tx);
}
