import SUBSCRIPTION_REPO from "../../../database/subscription/index.repo.js";
import AUDIT_SERVICE from "../../audit/index.service.js";
import { AppError } from "../../../types/AppError.js";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY,
} from "../../../constants/audit/auditActions.constant.js";
import { CreatePlanInput } from "../../../schemas/subscription/createPlan.schema.js";

export default async function createPlan(input: CreatePlanInput) {
  const existing = await SUBSCRIPTION_REPO.getPlanByCode(input.code);
  if (existing) {
    throw new AppError(`A plan with code ${input.code} already exists`, 409);
  }

  const plan = await SUBSCRIPTION_REPO.createPlan(input);

  await AUDIT_SERVICE.recordAudit({
    action: AUDIT_ACTION.CREATED,
    entityType: AUDIT_ENTITY.SUBSCRIPTION_PLAN,
    entityId: plan.id,
    newValue: plan,
  });

  return plan;
}
