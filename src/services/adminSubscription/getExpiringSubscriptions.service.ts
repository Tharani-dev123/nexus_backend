import prisma from "../../database/index.db.js";

export default async function getExpiringSubscriptions(days: number) {
  const now = new Date();
  const limitDate = new Date();
  limitDate.setDate(now.getDate() + days);

  const expiringSubs = await prisma.companySubscription.findMany({
    where: {
      isActive: true,
      status: "ACTIVE",
      endDate: {
        gte: now,
        lte: limitDate,
      },
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      plan: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      endDate: "asc",
    },
  });

  return expiringSubs.map((sub) => {
    const remainingDays = sub.endDate
      ? Math.max(0, Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      id: sub.id,
      companyId: sub.companyId,
      companyName: sub.company.name,
      companyEmail: sub.company.email || "—",
      planName: sub.plan.name,
      planCode: sub.plan.code,
      startDate: sub.startDate,
      endDate: sub.endDate,
      status: sub.status,
      remainingDays,
    };
  });
}
