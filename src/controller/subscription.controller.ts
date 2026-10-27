import { Request, Response } from "express";
import { successDataResponse } from "../handlers/serverResponse.handler.js";
import SUBSCRIPTION_SERVICE from "../services/subscription/index.service.js";
import { CreatePlanInput } from "../schemas/subscription/createPlan.schema.js";
import { UpdatePlanInput } from "../schemas/subscription/updatePlan.schema.js";

// ---- Plan catalogue ----

const listPlans = async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === "true";
  const plans = await SUBSCRIPTION_SERVICE.listPlans(includeInactive);
  return successDataResponse(res, plans, 200);
};

const createPlan = async (req: Request, res: Response) => {
  const plan = await SUBSCRIPTION_SERVICE.createPlan(req.body as CreatePlanInput);
  return successDataResponse(res, plan, 201);
};

const updatePlan = async (req: Request, res: Response) => {
  const plan = await SUBSCRIPTION_SERVICE.updatePlan(
    req.query.planId as string,
    req.body as UpdatePlanInput,
  );
  return successDataResponse(res, plan, 200);
};

// ---- Company subscription ----

const listSubscriptions = async (req: Request, res: Response) => {
  const subs = await SUBSCRIPTION_SERVICE.listCompanySubscriptions(
    req.company!.id,
  );
  return successDataResponse(res, subs, 200);
};

// ---- Module access / navigation ----

const getAccess = async (req: Request, res: Response) => {
  const access = await SUBSCRIPTION_SERVICE.getModuleAccessContext(
    req.company!.id,
    req.user?.userRole,
  );
  return successDataResponse(res, access, 200);
};

const getNavigation = async (req: Request, res: Response) => {
  const user = req.user;
  const company = req.company;
  const subscription = company
    ? await SUBSCRIPTION_SERVICE.getCompanySubscription(company.id)
    : null;
  const navigation = await SUBSCRIPTION_SERVICE.buildNavigation(user, company, subscription);
  return successDataResponse(res, navigation, 200);
};

const getCurrent = async (req: Request, res: Response) => {
  const access = await SUBSCRIPTION_SERVICE.getModuleAccessContext(
    req.company!.id,
    req.user?.userRole,
  );
  const sub = access.subscription;
  const now = new Date();

  // If there's an active sub but its endDate is in the past, treat as EXPIRED
  const isExpired = sub?.endDate && new Date(sub.endDate) < now;
  const status = sub && sub.isActive && !isExpired ? "ACTIVE" : "EXPIRED";

  const remainingDays = sub?.endDate && !isExpired
    ? Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return successDataResponse(res, {
    planName: sub?.planName || "None / Inactive",
    status,
    expiryDate: sub?.endDate || null,
    remainingDays,
    enabledModules: access.enabledModules,
  }, 200);
};

const SUBSCRIPTION_CONTROLLER = {
  listPlans,
  createPlan,
  updatePlan,
  listSubscriptions,
  getAccess,
  getNavigation,
  getCurrent,
};

export default SUBSCRIPTION_CONTROLLER;
