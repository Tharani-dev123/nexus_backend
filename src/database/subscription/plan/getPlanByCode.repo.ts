import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export default async function getPlanByCode(
  code: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.subscriptionPlan.findUnique({ where: { code } });
}
