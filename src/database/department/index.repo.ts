import createDepartment from "./create/createDepartment.repo.js";
import getDepartmentById from "./get/getDepartmentById.repo.js";
import getDepartmentsByCompany from "./get/getDepartmentsByCompany.repo.js";
import updateDepartment from "./update/updateDepartment.repo.js";
import deleteDepartment from "./delete/deleteDepartment.repo.js";

const DEPARTMENT_REPO = {
  createDepartment,
  getDepartmentById,
  getDepartmentsByCompany,
  updateDepartment,
  deleteDepartment,
};

export default DEPARTMENT_REPO;