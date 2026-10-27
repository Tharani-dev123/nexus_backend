import prisma from "../../../index.db.js";
import { Prisma } from "@prisma/client";

export default async function revokeAllRefreshTokensForUser(
  userId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
