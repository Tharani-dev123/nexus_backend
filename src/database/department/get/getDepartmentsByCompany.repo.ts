import prisma from "../../index.db.js";

export default async function getDepartmentsByCompany(
  companyId: string,
  branchId?: string,
) {
  return prisma.department.findMany({
    where: {
      companyId,
      ...(branchId ? { branchId } : {}),
      deletedAt: null,
    },
    select: {
      id: true,
      branchId: true,
      name: true,
      createdAt: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}
