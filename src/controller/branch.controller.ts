import { Request, Response } from "express";
import {
  successDataResponse,
  successMessageResponse,
} from "../handlers/serverResponse.handler.js";
import BRANCH_SERVICE from "../services/branch/index.service.js";
import { CreateBranchInput } from "../schemas/branch/createBranch.schema.js";
import { UpdateBranchInput } from "../schemas/branch/updateBranch.schema.js";
import { ListBranchesQuery } from "../schemas/branch/listBranches.schema.js";

const createBranch = async (req: Request, res: Response) => {
  const branch = await BRANCH_SERVICE.createBranch(
    req.company!.id,
    req.body as CreateBranchInput,
  );
  return successDataResponse(res, branch, 201);
};

const listBranches = async (req: Request, res: Response) => {
  const result = await BRANCH_SERVICE.listBranches(
    req.company!.id,
    req.query as unknown as ListBranchesQuery,
  );
  return successDataResponse(res, result, 200);
};

const getBranchById = async (req: Request, res: Response) => {
  const branch = await BRANCH_SERVICE.getBranchById(
    req.company!.id,
    req.query.id as string,
  );
  return successDataResponse(res, branch, 200);
};

const updateBranch = async (req: Request, res: Response) => {
  const branch = await BRANCH_SERVICE.updateBranch(
    req.company!.id,
    req.query.id as string,
    req.body as UpdateBranchInput,
  );
  return successDataResponse(res, branch, 200);
};

const deleteBranch = async (req: Request, res: Response) => {
  await BRANCH_SERVICE.deleteBranch(req.company!.id, req.query.id as string);
  return successMessageResponse(res, "Branch deleted successfully", 200);
};

const BRANCH_CONTROLLER = {
  createBranch,
  listBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};

export default BRANCH_CONTROLLER;
