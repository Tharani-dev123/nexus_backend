import { createPlanSchema } from "./createPlan.schema.js";
import { updatePlanSchema } from "./updatePlan.schema.js";
import { subscribeSchema } from "./subscribe.schema.js";
import { moduleAccessSchema } from "./moduleAccess.schema.js";

const SUBSCRIPTION_SCHEMAS = {
  createPlan: createPlanSchema,
  updatePlan: updatePlanSchema,
  subscribe: subscribeSchema,
  moduleAccess: moduleAccessSchema,
};

export default SUBSCRIPTION_SCHEMAS;
