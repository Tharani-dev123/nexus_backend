import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export default async function findUserWithCredentialById(
  id: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.user.findUnique({
    where: { id, deletedAt: null },
    include: {
      credential: {
        select: { passwordHash: true },
      },
    },
  });
}
