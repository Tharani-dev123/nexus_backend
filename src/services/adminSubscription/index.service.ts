import activateSubscription from "./activateSubscription.service.js";
import renewSubscription from "./renewSubscription.service.js";
import cancelSubscription from "./cancelSubscription.service.js";
import getCompanySubscription from "./getCompanySubscription.service.js";
import getPendingCompanies from "./getPendingCompanies.service.js";
import listAllSubscriptions from "./listAllSubscriptions.service.js";
import changePlanSubscription from "./changePlanSubscription.service.js";
import suspendSubscription from "./suspendSubscription.service.js";
import reactivateSubscription from "./reactivateSubscription.service.js";
import getExpiringSubscriptions from "./getExpiringSubscriptions.service.js";

const ADMIN_SUBSCRIPTION_SERVICE = {
  activateSubscription,
  renewSubscription,
  cancelSubscription,
  getCompanySubscription,
  getPendingCompanies,
  listAllSubscriptions,
  changePlanSubscription,
  suspendSubscription,
  reactivateSubscription,
  getExpiringSubscriptions,
};

export default ADMIN_SUBSCRIPTION_SERVICE;
