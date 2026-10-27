import { Router } from "express";
import validateInput from "../middleware/inputValidator.middleware.js";
import ADMIN_SUBSCRIPTION_CONTROLLER from "../controller/adminSubscription.controller.js";
import {
  activateSubscriptionSchema,
  renewSubscriptionSchema,
  cancelSubscriptionSchema,
  changePlanSubscriptionSchema,
  suspendSubscriptionSchema,
  reactivateSubscriptionSchema,
} from "../schemas/subscription/adminSubscription.schema.js";
import { listAllSubscriptionsSchema } from "../schemas/subscription/listAllSubscriptions.schema.js";

const adminSubscriptionRouter = Router();

adminSubscriptionRouter.post(
  "/activate",
  validateInput(activateSubscriptionSchema),
  ADMIN_SUBSCRIPTION_CONTROLLER.activate,
);

adminSubscriptionRouter.post(
  "/renew",
  validateInput(renewSubscriptionSchema),
  ADMIN_SUBSCRIPTION_CONTROLLER.renew,
);

adminSubscriptionRouter.post(
  "/cancel",
  validateInput(cancelSubscriptionSchema),
  ADMIN_SUBSCRIPTION_CONTROLLER.cancel,
);

adminSubscriptionRouter.post(
  "/change-plan",
  validateInput(changePlanSubscriptionSchema),
  ADMIN_SUBSCRIPTION_CONTROLLER.changePlan,
);

adminSubscriptionRouter.post(
  "/suspend",
  validateInput(suspendSubscriptionSchema),
  ADMIN_SUBSCRIPTION_CONTROLLER.suspend,
);

adminSubscriptionRouter.post(
  "/reactivate",
  validateInput(reactivateSubscriptionSchema),
  ADMIN_SUBSCRIPTION_CONTROLLER.reactivate,
);

adminSubscriptionRouter.get(
  "/company/:companyId/payments",
  ADMIN_SUBSCRIPTION_CONTROLLER.getCompanyPayments,
);

adminSubscriptionRouter.get(
  "/company/:companyId/history",
  ADMIN_SUBSCRIPTION_CONTROLLER.getCompanyHistory,
);

adminSubscriptionRouter.get(
  "/company/:companyId",
  ADMIN_SUBSCRIPTION_CONTROLLER.getCompanySubscription,
);

adminSubscriptionRouter.get(
  "/pending",
  ADMIN_SUBSCRIPTION_CONTROLLER.getPendingCompanies,
);

adminSubscriptionRouter.get(
  "/expiring",
  ADMIN_SUBSCRIPTION_CONTROLLER.getExpiring,
);

adminSubscriptionRouter.get(
  "/",
  validateInput(listAllSubscriptionsSchema),
  ADMIN_SUBSCRIPTION_CONTROLLER.listAll,
);

export default adminSubscriptionRouter;
