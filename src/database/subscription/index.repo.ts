import createPlan from "./plan/createPlan.repo.js";
import upsertPlanByCode from "./plan/upsertPlanByCode.repo.js";
import getPlanById from "./plan/getPlanById.repo.js";
import getPlanByCode from "./plan/getPlanByCode.repo.js";
import listPlans from "./plan/listPlans.repo.js";
import updatePlan from "./plan/updatePlan.repo.js";

import createSubscription from "./subscription/createSubscription.repo.js";
import getActiveSubscription from "./subscription/getActiveSubscription.repo.js";
import listSubscriptions from "./subscription/listSubscriptions.repo.js";
import deactivateActiveSubscriptions from "./subscription/deactivateActiveSubscriptions.repo.js";

import upsertCompanyModule from "./module/upsertCompanyModule.repo.js";
import getCompanyModule from "./module/getCompanyModule.repo.js";
import listCompanyModules from "./module/listCompanyModules.repo.js";
import setModuleEnabled from "./module/setModuleEnabled.repo.js";

const SUBSCRIPTION_REPO = {
  createPlan,
  upsertPlanByCode,
  getPlanById,
  getPlanByCode,
  listPlans,
  updatePlan,
  createSubscription,
  getActiveSubscription,
  listSubscriptions,
  deactivateActiveSubscriptions,
  upsertCompanyModule,
  getCompanyModule,
  listCompanyModules,
  setModuleEnabled,
};

export default SUBSCRIPTION_REPO;
