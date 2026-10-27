import createCompany from "./create/createCompany.service.js";
import getCompanyById from "./get/getCompanyById.service.js";
import updateCompany from "./update/updateCompany.service.js";
import deleteCompany from "./update/deleteCompany.service.js";

const COMPANY_SERVICE = {
  createCompany,
  getCompanyById,
  updateCompany,
  deleteCompany,
};

export default COMPANY_SERVICE;