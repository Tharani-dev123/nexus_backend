import DEPARTMENT_REPO from "../../../database/department/index.repo.js";

export default async function getDepartmentsByCompany(
  companyId: string,
  branchId?: string,
) {
  return await DEPARTMENT_REPO.getDepartmentsByCompany(
    companyId,
    branchId,
  );
}
