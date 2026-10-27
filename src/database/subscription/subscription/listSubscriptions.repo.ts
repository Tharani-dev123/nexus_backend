import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export default async function listSubscriptions(
  companyId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.companySubscription.findMany({
    where: { companyId },
    orderBy: { startDate: "desc" },
    include: { plan: true },
  });
}
