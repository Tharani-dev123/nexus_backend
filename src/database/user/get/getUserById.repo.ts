import { Prisma } from "@prisma/client";

import prisma from "../../index.db.js";

export default async function findSafeUserById(
  id: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.user.findUnique({
    where: { id, deletedAt: null },
  });
}
