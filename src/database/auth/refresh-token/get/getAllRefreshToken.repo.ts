import { User, Prisma } from "@prisma/client";
import prisma from "../../../index.db.js";

export default async function getAllRefreshTokenByUser(
  user: User,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.refreshToken.findMany({
    where: {
      userId: user.id,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
