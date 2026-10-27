import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export default async function getBranchById(
  id: string,
  companyId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.branch.findFirst({
    where: { id, companyId, deletedAt: null },
  });
}
