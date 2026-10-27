import prisma from "../../../index.db.js";
import { Prisma } from "@prisma/client";

export default async function createRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.refreshToken.create({
    data: {
      tokenHash,
      expiresAt,
      userId,
    },
  });
}
