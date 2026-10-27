import { Prisma } from "@prisma/client";
import prisma from "../../../index.db.js";

export default async function extendRefreshToken(
  id: string,
  expiresAt: Date,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.refreshToken.update({
    where: { id },
    data: { expiresAt },
  });
}
