import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

/**
 * Given a list of candidate emails, returns the subset that already belongs to a
 * (non-deleted) user account before creating new invited accounts.
 */
export default async function findEmailsInUse(
  emails: string[],
  tx: Prisma.TransactionClient = prisma,
): Promise<Set<string>> {
  if (emails.length === 0) return new Set();

  const users = await tx.user.findMany({
    where: { email: { in: emails }, deletedAt: null },
    select: { email: true },
  });

  return new Set(users.map((u) => u.email));
}
