import createDepartment from "./create/createDepartment.service.js";
import getDepartmentById from "./get/getDepartmentById.service.js";
import getDepartmentsByCompany from "./get/getDepartmentsByCompany.service.js";
import updateDepartment from "./update/updateDepartment.service.js";
import deleteDepartment from "./delete/deleteDepartment.service.js";

const DEPARTMENT_SERVICE = {
  createDepartment,
  getDepartmentById,
  getDepartmentsByCompany,
  updateDepartment,
  deleteDepartment,
};

export default DEPARTMENT_SERVICE;