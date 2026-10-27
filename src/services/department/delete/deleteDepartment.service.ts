import DEPARTMENT_REPO from "../../../database/department/index.repo.js";

export default async function deleteDepartment(
  departmentId: string,
) {
  return await DEPARTMENT_REPO.deleteDepartment(
    departmentId,
  );
}