import { Prisma, ProductModule } from "@prisma/client";
import SUBSCRIPTION_REPO from "../../../database/subscription/index.repo.js";

/** The company's currently enabled module codes. */
export default async function getEnabledModules(
  companyId: string,
  tx?: Prisma.TransactionClient,
): Promise<ProductModule[]> {
  const rows = await SUBSCRIPTION_REPO.listCompanyModules(
    companyId,
    { includeDisabled: false },
    tx,
  );
  return rows.map((r) => r.moduleCode);
}
