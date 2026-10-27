import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export default async function updateBranch(
  id: string,
  data: Prisma.BranchUpdateInput,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.branch.update({ where: { id }, data });
}
