import prisma from "../../../index.db.js";
import { Prisma } from "@prisma/client";

export default async function revokeRefreshTokenById(
  id: string,

  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}
