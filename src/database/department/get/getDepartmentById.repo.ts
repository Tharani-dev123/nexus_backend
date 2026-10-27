import prisma from "../../index.db.js";

export default async function getDepartmentById(
  departmentId: string,
) {
  return prisma.department.findFirst({
    where: {
      id: departmentId,
      deletedAt: null,
    },
  });
}