import { Prisma, ProductModule } from "@prisma/client";
import prisma from "../../index.db.js";

export default async function getCompanyModule(
  companyId: string,
  moduleCode: ProductModule,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.companyModule.findUnique({
    where: { companyId_moduleCode: { companyId, moduleCode } },
  });
}
