import prisma from "../../../index.db.js";
import { Prisma } from "@prisma/client";

export default async function revokeRefreshTokenByHash(
  tokenHash: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
