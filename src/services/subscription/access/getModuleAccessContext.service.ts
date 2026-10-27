import { Prisma, ProductModule, UserRole } from "@prisma/client";
import SUBSCRIPTION_REPO from "../../../database/subscription/index.repo.js";
import getEnabledModules from "../module/getEnabledModules.service.js";
import buildNavigation, { Navigation } from "./buildNavigation.service.js";
import checkAndExpireSubscription from "../subscription/checkAndExpireSubscription.service.js";

export interface SubscriptionSummary {
  id: string;
  planId: string;
  planCode: string;
  planName: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
}

export interface ModuleAccessContext {
  companyId: string;
  subscription: SubscriptionSummary | null;
  enabledModules: ProductModule[];
  /** Dynamic sidebar payload for this company. */
  navigation: Navigation;
}

/**
 * The canonical access snapshot for a company — powers the login response, the
 * `/subscription/access` endpoint and the dynamic sidebar. Single round of
 * lookups so it is cheap to call on login.
 */
export default async function getModuleAccessContext(
  companyId: string,
  userRole?: UserRole,
  tx?: Prisma.TransactionClient,
): Promise<ModuleAccessContext> {
  const subscription = await checkAndExpireSubscription(companyId, tx);
  const enabledModules = await getEnabledModules(companyId, tx);

  const isActive = subscription?.isActive ?? false;

  const actualEnabledModules = isActive ? enabledModules : [];
  const navigation = await buildNavigation(
    userRole ? { userRole } : null,
    { id: companyId },
    subscription,
    actualEnabledModules,
  );

  return {
    companyId,
    subscription: subscription
      ? {
          id: subscription.id,
          planId: subscription.planId,
          planCode: subscription.plan.code,
          planName: subscription.plan.name,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          isActive: subscription.isActive,
        }
      : null,
    enabledModules: actualEnabledModules,
    navigation,
  };
}
