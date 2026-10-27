import { createBranchSchema } from "./createBranch.schema.js";
import { updateBranchSchema } from "./updateBranch.schema.js";
import { listBranchesSchema } from "./listBranches.schema.js";

const BRANCH_SCHEMAS = {
  createBranch: createBranchSchema,
  updateBranch: updateBranchSchema,
  listBranches: listBranchesSchema,
};

export default BRANCH_SCHEMAS;
