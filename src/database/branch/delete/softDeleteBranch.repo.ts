import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export default async function softDeleteBranch(
  id: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.branch.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}
