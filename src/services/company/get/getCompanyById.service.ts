import COMPANY_REPO from "../../../database/company/index.repo.js";
import { AppError } from "../../../types/AppError.js";

export default async function getCompanyById(
  companyId: string,
) {
  const company = await COMPANY_REPO.getCompanyById(companyId);

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  return company;
}