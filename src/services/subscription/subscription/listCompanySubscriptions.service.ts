import SUBSCRIPTION_REPO from "../../../database/subscription/index.repo.js";

/** Full subscription history for a company (newest first). */
export default async function listCompanySubscriptions(companyId: string) {
  return SUBSCRIPTION_REPO.listSubscriptions(companyId);
}
