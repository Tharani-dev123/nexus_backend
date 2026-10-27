import DEPARTMENT_REPO from "../../../database/department/index.repo.js";
import { UpdateDepartmentInput } from "../../../schemas/department/updateDepartment.schema.js";
import BRANCH_SERVICE from "../../branch/index.service.js";

export default async function updateDepartment(
  companyId: string,
  departmentId: string,
  data: UpdateDepartmentInput,
) {
  if (data.branchId) {
    await BRANCH_SERVICE.getBranchById(companyId, data.branchId);
  }

  return await DEPARTMENT_REPO.updateDepartment(
    departmentId,
    data,
  );
}
