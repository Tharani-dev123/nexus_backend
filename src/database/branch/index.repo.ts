import createBranch from "./create/createBranch.repo.js";
import getBranchById from "./get/getBranchById.repo.js";
import listBranches from "./get/listBranches.repo.js";
import updateBranch from "./update/updateBranch.repo.js";
import softDeleteBranch from "./delete/softDeleteBranch.repo.js";

const BRANCH_REPO = {
  createBranch,
  getBranchById,
  listBranches,
  updateBranch,
  softDeleteBranch,
};

export default BRANCH_REPO;
