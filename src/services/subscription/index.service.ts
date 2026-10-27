import listPlans from "./plan/listPlans.service.js";
import createPlan from "./plan/createPlan.service.js";
import updatePlan from "./plan/updatePlan.service.js";

import subscribeCompany from "./subscription/subscribeCompany.service.js";
import getCompanySubscription from "./subscription/getCompanySubscription.service.js";
import listCompanySubscriptions from "./subscription/listCompanySubscriptions.service.js";

import getEnabledModules from "./module/getEnabledModules.service.js";

import getModuleAccessContext from "./access/getModuleAccessContext.service.js";
import assertModuleEnabled from "./access/assertModuleEnabled.service.js";
import buildNavigation from "./access/buildNavigation.service.js";

const SUBSCRIPTION_SERVICE = {
  // Plan catalogue
  listPlans,
  createPlan,
  updatePlan,
  // Company subscriptions
  subscribeCompany,
  getCompanySubscription,
  listCompanySubscriptions,
  // Module access
  getEnabledModules,
  // Access resolution (login / sidebar / middleware)
  getModuleAccessContext,
  assertModuleEnabled,
  buildNavigation,
};

export default SUBSCRIPTION_SERVICE;
