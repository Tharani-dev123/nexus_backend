import { Prisma, ProductModule } from "@prisma/client";
import prisma from "../../index.db.js";

export interface UpsertCompanyModuleData {
  companyId: string;
  moduleCode: ProductModule;
  isEnabled: boolean;
}

/**
 * Provisions or re-enables a module for a company. Keyed on the
 * (companyId, moduleCode) unique — re-activating a previously disabled module
 * refreshes `activatedAt` and flips `isEnabled` without creating duplicates.
 */
export default async function upsertCompanyModule(
  data: UpsertCompanyModuleData,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.companyModule.upsert({
    where: {
      companyId_moduleCode: {
        companyId: data.companyId,
        moduleCode: data.moduleCode,
      },
    },
    update: {
      isEnabled: data.isEnabled,
      ...(data.isEnabled ? { activatedAt: new Date() } : {}),
    },
    create: {
      companyId: data.companyId,
      moduleCode: data.moduleCode,
      isEnabled: data.isEnabled,
    },
  });
}
