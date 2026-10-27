import { Router } from "express";

import authorizeCompanyAccess from "../middleware/company/authorizeCompanyAccess.middleware.js";
import requirePermission from "../middleware/rbac/requirePermission.middleware.js";
import { RESOURCE, ACTION } from "../constants/rbac/permissions.constant.js";

import SUBSCRIPTION_CONTROLLER from "../controller/subscription.controller.js";

const subscriptionRouter = Router();

// ---- Module access / navigation (protected by company scope) ----
subscriptionRouter.get("/access", authorizeCompanyAccess, SUBSCRIPTION_CONTROLLER.getAccess);
subscriptionRouter.get("/navigation", authorizeCompanyAccess, SUBSCRIPTION_CONTROLLER.getNavigation);
subscriptionRouter.get("/current", authorizeCompanyAccess, SUBSCRIPTION_CONTROLLER.getCurrent);

// ---- Plan catalogue (global read-only endpoint) ----
subscriptionRouter.get(
  "/plans",
  SUBSCRIPTION_CONTROLLER.listPlans,
);

subscriptionRouter.post(
  "/plans",
  requirePermission(RESOURCE.SUBSCRIPTION, ACTION.CREATE),
  SUBSCRIPTION_CONTROLLER.createPlan,
);

subscriptionRouter.patch(
  "/plans",
  requirePermission(RESOURCE.SUBSCRIPTION, ACTION.UPDATE),
  SUBSCRIPTION_CONTROLLER.updatePlan,
);

// ---- Company subscription history (protected by company scope) ----
subscriptionRouter.get(
  "/subscriptions",
  authorizeCompanyAccess,
  requirePermission(RESOURCE.SUBSCRIPTION, ACTION.READ),
  SUBSCRIPTION_CONTROLLER.listSubscriptions,
);

export default subscriptionRouter;
