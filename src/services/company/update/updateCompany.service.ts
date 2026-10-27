import COMPANY_REPO from "../../../database/company/index.repo.js";
import { CompanyUpdateInput } from "../../../schemas/company/updateCompany.schema.js";
import { AppError } from "../../../types/AppError.js";

export default async function updateCompany(
  companyId: string,
  data: CompanyUpdateInput,
) {

  return await COMPANY_REPO.updateCompany(companyId, data);
}