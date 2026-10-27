import { Router } from "express";

import validateInput from "../middleware/inputValidator.middleware.js";
import requirePermission from "../middleware/rbac/requirePermission.middleware.js";
import { RESOURCE, ACTION } from "../constants/rbac/permissions.constant.js";

import BRANCH_CONTROLLER from "../controller/branch.controller.js";
import BRANCH_SCHEMAS from "../schemas/branch/index.schema.js";

const branchRouter = Router();

branchRouter.post(
  "/create-branch",
  requirePermission(RESOURCE.BRANCH, ACTION.CREATE),
  validateInput(BRANCH_SCHEMAS.createBranch),
  BRANCH_CONTROLLER.createBranch,
);

branchRouter.get(
  "/list-branches",
  validateInput(BRANCH_SCHEMAS.listBranches),
  BRANCH_CONTROLLER.listBranches,
);

branchRouter.get("/get-branch-by-id", BRANCH_CONTROLLER.getBranchById);

branchRouter.patch(
  "/update-branch",
  requirePermission(RESOURCE.BRANCH, ACTION.UPDATE),
  validateInput(BRANCH_SCHEMAS.updateBranch),
  BRANCH_CONTROLLER.updateBranch,
);

branchRouter.delete(
  "/delete-branch",
  requirePermission(RESOURCE.BRANCH, ACTION.DELETE),
  BRANCH_CONTROLLER.deleteBranch,
);

export default branchRouter;
