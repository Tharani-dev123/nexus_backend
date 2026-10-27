import SUBSCRIPTION_REPO from "../../../database/subscription/index.repo.js";
import { modulesForPlan } from "../../../constants/subscription/plans.constant.js";

/** Plan catalogue, each annotated with the modules it grants (from PLAN_MODULES). */
export default async function listPlans(includeInactive = false) {
  const plans = await SUBSCRIPTION_REPO.listPlans({ includeInactive });
  return plans.map((plan) => ({
    ...plan,
    modules: modulesForPlan(plan.code) ?? [],
  }));
}
