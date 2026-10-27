import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export default async function deleteCompany(
  companyId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  const company = await tx.company.update({
    where: { id: companyId },
    data: {
      deletedAt: new Date(),
    },
  });

  await tx.user.updateMany({
    where: { companyId },
    data: {
      companyId: null,
    },
  });

  return company;
}