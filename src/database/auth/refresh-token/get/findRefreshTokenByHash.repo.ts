import prisma from "../../../index.db.js";
import { Prisma } from "@prisma/client";
export default async function findRefreshTokenByHash(
  tokenHash: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.refreshToken.findUnique({
    where: {tokenHash},
  });
}
