import prisma from "../../database/index.db.js";

export default async function getPendingCompanies() {
  const pendingCompanies = await prisma.company.findMany({
    where: {
      deletedAt: null,
      subscriptions: {
        none: {
          isActive: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return pendingCompanies;
}
