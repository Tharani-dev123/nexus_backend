import { Prisma, Company } from "@prisma/client";
import prisma from "../../index.db.js";
import { CreateDepartmentInput } from "../../../schemas/department/createDepartment.schema.js";

export default async function createDepartment(
  company: Company,
  data: CreateDepartmentInput,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.department.create({
    data: {
      companyId: company.id,
      branchId: data.branchId,
      name: data.name,
    },
  });
}
