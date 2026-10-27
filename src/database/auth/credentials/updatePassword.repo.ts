import prisma from "../../index.db.js";
import { Prisma, User } from "@prisma/client";

export default async function updateUserPasswordHash(
  user: User,
  passwordHash: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.credential.update({
    where: { userId: user.id },
    data: { passwordHash },
  });
}
