import { Prisma, User } from "@prisma/client";
import prisma from "../../index.db.js";

export default async function verifyEmailRepo(
  user: User,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true },
  });
}
