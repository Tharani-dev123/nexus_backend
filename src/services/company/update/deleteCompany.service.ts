import COMPANY_REPO from "../../../database/company/index.repo.js";
import { AppError } from "../../../types/AppError.js";

export default async function deleteCompany(
  companyId: string,
) {
  return await COMPANY_REPO.deleteCompany(companyId);
}