import createCompany from "./create/createCompany.repo.js";
import getCompanyById from "./get/getCompanyById.repo.js";
import updateCompany from "./update/updateCompany.repo.js";
import deleteCompany from "./delete/deleteCompany.repo.js";

const COMPANY_REPO = {
  createCompany,
  getCompanyById, 
  updateCompany,
  deleteCompany,
}; 

export default COMPANY_REPO;