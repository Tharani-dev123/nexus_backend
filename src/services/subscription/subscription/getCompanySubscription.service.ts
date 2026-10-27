import checkAndExpireSubscription from "./checkAndExpireSubscription.service.js";

/** Active subscription for a company (null when on no plan). */
export default async function getCompanySubscription(companyId: string) {
  return checkAndExpireSubscription(companyId);
}
