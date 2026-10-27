import { Prisma, ProductModule } from "@prisma/client";
import prisma from "../../index.db.js";

/** Flips a single module's enabled flag for a company. */
export default async function setModuleEnabled(
  companyId: string,
  moduleCode: ProductModule,
  isEnabled: boolean,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.companyModule.update({
    where: { companyId_moduleCode: { companyId, moduleCode } },
    data: {
      isEnabled,
      ...(isEnabled ? { activatedAt: new Date() } : {}),
    },
  });
}
