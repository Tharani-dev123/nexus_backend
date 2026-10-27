import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export default async function deleteDepartment(
  departmentId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.department.update({
    where: {
      id: departmentId,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}