import createBranch from "./create/createBranch.service.js";
import getBranchById from "./get/getBranchById.service.js";
import listBranches from "./list/listBranches.service.js";
import updateBranch from "./update/updateBranch.service.js";
import deleteBranch from "./delete/deleteBranch.service.js";

const BRANCH_SERVICE = {
  createBranch,
  getBranchById,
  listBranches,
  updateBranch,
  deleteBranch,
};

export default BRANCH_SERVICE;
