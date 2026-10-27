import DEPARTMENT_REPO from "../../../database/department/index.repo.js";
import { AppError } from "../../../types/AppError.js";

export default async function getDepartmentById(
  departmentId: string,
) {
  const department =
    await DEPARTMENT_REPO.getDepartmentById(
      departmentId,
    );

  if (!department) {
    throw new AppError(
      "Department not found",
      404,
    );
  }

  return department;
}