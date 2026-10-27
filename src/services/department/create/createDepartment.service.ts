import { Company } from "@prisma/client";
import DEPARTMENT_REPO from "../../../database/department/index.repo.js";
import { CreateDepartmentInput } from "../../../schemas/department/createDepartment.schema.js";
import { AppError } from "../../../types/AppError.js";
import BRANCH_SERVICE from "../../branch/index.service.js";

export default async function createDepartment(
  company: Company,
  data: CreateDepartmentInput,
) {
  await BRANCH_SERVICE.getBranchById(company.id, data.branchId);

  const existing = await DEPARTMENT_REPO.getDepartmentsByCompany(
    company.id,
    data.branchId,
  );

const alreadyExists = existing.some(
  (d) =>
    d.name.toLowerCase() ===
    data.name.toLowerCase(),
);

if (alreadyExists) {
  throw new AppError(
    "Department already exists",
    409,
  );
}
  return await DEPARTMENT_REPO.createDepartment(
    company,
    data,
  );
}
