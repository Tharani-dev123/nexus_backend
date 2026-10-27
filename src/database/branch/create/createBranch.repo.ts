import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export interface CreateBranchData {
  companyId: string;
  name: string;
  code: string;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pinCode?: string | null;
}

export default async function createBranch(
  data: CreateBranchData,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.branch.create({ data });
}
