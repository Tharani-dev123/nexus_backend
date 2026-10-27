import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";
import {CompanyUpdateInput} from "../../../schemas/company/updateCompany.schema.js";
import { AppError } from "../../../types/AppError.js";


export default async function updateCompany(
  companyId: string,
  data: CompanyUpdateInput,
  tx: Prisma.TransactionClient = prisma,
) {
  const company = await tx.company.findFirst({
  where: {
    id: companyId,
    deletedAt: null,
  },
});

if (!company) {
  throw new AppError("Company not found", 404);
}

return tx.company.update({
  where: {
    id: companyId,
  },
  data,
});
}