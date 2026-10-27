import { Request, Response } from "express";
import { successDataResponse } from "../handlers/serverResponse.handler.js";
import ADMIN_SUBSCRIPTION_SERVICE from "../services/adminSubscription/index.service.js";
import {
  ActivateSubscriptionInput,
  RenewSubscriptionInput,
  CancelSubscriptionInput,
  ChangePlanSubscriptionInput,
  SuspendSubscriptionInput,
  ReactivateSubscriptionInput,
} from "../schemas/subscription/adminSubscription.schema.js";
import { ListAllSubscriptionsInput } from "../schemas/subscription/listAllSubscriptions.schema.js";

const activate = async (req: Request, res: Response) => {
  const adminUserId = req.user.id;
  const subscription = await ADMIN_SUBSCRIPTION_SERVICE.activateSubscription(
    adminUserId,
    req.body as ActivateSubscriptionInput,
  );
  return res.status(201).json({
    success: true,
    message: "Subscription activated successfully",
    subscription,
  });
};

const renew = async (req: Request, res: Response) => {
  const adminUserId = req.user.id;
  const result = await ADMIN_SUBSCRIPTION_SERVICE.renewSubscription(
    adminUserId,
    req.body as RenewSubscriptionInput,
  );
  return res.status(200).json({
    success: true,
    message: "Subscription renewed successfully",
    endDate: result.endDate,
  });
};

const cancel = async (req: Request, res: Response) => {
  const adminUserId = req.user.id;
  const result = await ADMIN_SUBSCRIPTION_SERVICE.cancelSubscription(
    adminUserId,
    req.body as CancelSubscriptionInput,
  );
  return res.status(200).json({
    success: true,
    message: "Subscription cancelled successfully",
    disabledModulesCount: result.disabledModulesCount,
  });
};

const getCompanySubscription = async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const details = await ADMIN_SUBSCRIPTION_SERVICE.getCompanySubscription(companyId);
  return successDataResponse(res, details, 200);
};

const getPendingCompanies = async (req: Request, res: Response) => {
  const pending = await ADMIN_SUBSCRIPTION_SERVICE.getPendingCompanies();
  return successDataResponse(res, pending, 200);
};

const listAll = async (req: Request, res: Response) => {
  const query = req.query as unknown as ListAllSubscriptionsInput;
  const subscriptions = await ADMIN_SUBSCRIPTION_SERVICE.listAllSubscriptions(query);
  return successDataResponse(res, subscriptions, 200);
};

const changePlan = async (req: Request, res: Response) => {
  const adminUserId = req.user.id;
  const subscription = await ADMIN_SUBSCRIPTION_SERVICE.changePlanSubscription(
    adminUserId,
    req.body as ChangePlanSubscriptionInput,
  );
  return res.status(200).json({
    success: true,
    message: "Subscription plan changed successfully",
    subscription,
  });
};

const suspend = async (req: Request, res: Response) => {
  const adminUserId = req.user.id;
  const subscription = await ADMIN_SUBSCRIPTION_SERVICE.suspendSubscription(
    adminUserId,
    req.body as SuspendSubscriptionInput,
  );
  return res.status(200).json({
    success: true,
    message: "Subscription suspended successfully",
    subscription,
  });
};

const reactivate = async (req: Request, res: Response) => {
  const adminUserId = req.user.id;
  const subscription = await ADMIN_SUBSCRIPTION_SERVICE.reactivateSubscription(
    adminUserId,
    req.body as ReactivateSubscriptionInput,
  );
  return res.status(200).json({
    success: true,
    message: "Subscription reactivated successfully",
    subscription,
  });
};

const getCompanyPayments = async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const details = await ADMIN_SUBSCRIPTION_SERVICE.getCompanySubscription(companyId);
  return successDataResponse(res, details.paymentHistory, 200);
};

const getCompanyHistory = async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const details = await ADMIN_SUBSCRIPTION_SERVICE.getCompanySubscription(companyId);
  return successDataResponse(res, details.auditHistory, 200);
};

const getExpiring = async (req: Request, res: Response) => {
  const days = typeof req.query.days === "string" ? parseInt(req.query.days, 10) : 30;
  const list = await ADMIN_SUBSCRIPTION_SERVICE.getExpiringSubscriptions(days);
  return successDataResponse(res, list, 200);
};

const ADMIN_SUBSCRIPTION_CONTROLLER = {
  activate,
  renew,
  cancel,
  getCompanySubscription,
  getPendingCompanies,
  listAll,
  changePlan,
  suspend,
  reactivate,
  getCompanyPayments,
  getCompanyHistory,
  getExpiring,
};

export default ADMIN_SUBSCRIPTION_CONTROLLER;
