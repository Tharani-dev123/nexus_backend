import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";
import { UpdateDepartmentInput } from "../../../schemas/department/updateDepartment.schema.js";

export default async function updateDepartment(
  departmentId: string,
  data: UpdateDepartmentInput,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.department.update({
    where: {
      id: departmentId,
    },
    data,
  });
}