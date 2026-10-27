import SUBSCRIPTION_REPO from "../../../database/subscription/index.repo.js";
import AUDIT_SERVICE from "../../audit/index.service.js";
import { AppError } from "../../../types/AppError.js";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY,
} from "../../../constants/audit/auditActions.constant.js";
import { UpdatePlanInput } from "../../../schemas/subscription/updatePlan.schema.js";

export default async function updatePlan(
  planId: string,
  input: UpdatePlanInput,
) {
  const existing = await SUBSCRIPTION_REPO.getPlanById(planId);
  if (!existing) throw new AppError("Plan not found", 404);

  const plan = await SUBSCRIPTION_REPO.updatePlan(planId, input);

  await AUDIT_SERVICE.recordAudit({
    action: AUDIT_ACTION.UPDATED,
    entityType: AUDIT_ENTITY.SUBSCRIPTION_PLAN,
    entityId: plan.id,
    oldValue: existing,
    newValue: plan,
  });

  return plan;
}
