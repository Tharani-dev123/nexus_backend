import { Prisma } from "@prisma/client";
import prisma from "../../../index.db.js";

export default async function getRefreshTokenById(
  id: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.refreshToken.findUnique({
    where: { id },
  });
}
