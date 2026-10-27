import COMPANY_REPO from "../../../database/company/index.repo.js";
import { CreateCompanyInput } from "../../../schemas/company/createCompany.schema.js";
import {User} from "@prisma/client";

export default async function createCompany(
  company: CreateCompanyInput,
  user: User,
) {
  return await COMPANY_REPO.createCompany(company,user);
}