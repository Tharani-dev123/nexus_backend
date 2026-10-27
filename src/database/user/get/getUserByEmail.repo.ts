import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export default async function findUserByEmail(
  email: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.user.findUnique({ where: { email, deletedAt: null } });
}
