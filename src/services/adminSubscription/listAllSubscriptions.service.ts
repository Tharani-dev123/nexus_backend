import { Prisma } from "@prisma/client";
import prisma from "../../database/index.db.js";
import { ListAllSubscriptionsInput } from "../../schemas/subscription/listAllSubscriptions.schema.js";

export default async function listAllSubscriptions(input: ListAllSubscriptionsInput) {
  const { page, pageSize, search, status, plan, module, expiresWithin, sortBy, sortOrder } = input;

  // 1. Build the dynamic SQL WHERE conditions
  const conditions: Prisma.Sql[] = [Prisma.sql`c."deletedAt" IS NULL`];

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      Prisma.sql`(c.name ILIKE ${searchPattern} OR c.email ILIKE ${searchPattern} OR p.name ILIKE ${searchPattern} OR p.code ILIKE ${searchPattern})`,
    );
  }

  if (plan) {
    conditions.push(Prisma.sql`p.code = ${plan}`);
  }

  if (status) {
    if (status === "EXPIRED") {
      conditions.push(
        Prisma.sql`(s.status = 'EXPIRED' OR s.status IS NULL OR (s.status = 'ACTIVE' AND s."endDate" < NOW()))`,
      );
    } else if (status === "ACTIVE") {
      conditions.push(Prisma.sql`s.status = 'ACTIVE' AND s."endDate" >= NOW()`);
    } else {
      conditions.push(Prisma.sql`s.status = ${status}`);
    }
  }

  if (module) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "CompanyModule" cm 
      WHERE cm."companyId" = c.id AND cm."moduleCode" = ${module} AND cm."isEnabled" = true
    )`);
  }

  if (expiresWithin) {
    conditions.push(
      Prisma.sql`s."endDate" >= NOW() AND s."endDate" <= NOW() + ${expiresWithin} * INTERVAL '1 day'`,
    );
  }

  const whereSql = Prisma.join(conditions, " AND ");

  // 2. Build sorting logic
  let orderBySql = Prisma.sql`c.name ASC`;
  if (sortBy === "name") {
    orderBySql = sortOrder === "desc" ? Prisma.sql`c.name DESC` : Prisma.sql`c.name ASC`;
  } else if (sortBy === "plan") {
    orderBySql = sortOrder === "desc" ? Prisma.sql`p.name DESC` : Prisma.sql`p.name ASC`;
  } else if (sortBy === "startDate") {
    orderBySql = sortOrder === "desc" ? Prisma.sql`s."startDate" DESC` : Prisma.sql`s."startDate" ASC`;
  } else if (sortBy === "endDate") {
    orderBySql = sortOrder === "desc" ? Prisma.sql`s."endDate" DESC` : Prisma.sql`s."endDate" ASC`;
  } else if (sortBy === "remainingDays") {
    orderBySql = sortOrder === "desc" ? Prisma.sql`s."endDate" DESC` : Prisma.sql`s."endDate" ASC`;
  }

  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  // 3. Dynamic paginated list query
  const itemsQuery = Prisma.sql`
    WITH latest_subs AS (
      SELECT *,
        ROW_NUMBER() OVER (PARTITION BY "companyId" ORDER BY "startDate" DESC) as rn
      FROM "CompanySubscription"
    )
    SELECT 
      c.id,
      c.name,
      c.email,
      c."createdAt",
      s.id as "subscriptionId",
      CASE 
        WHEN s.status = 'ACTIVE' AND s."endDate" < NOW() THEN 'EXPIRED'
        ELSE COALESCE(s.status, 'EXPIRED')
      END as "status",
      s."startDate",
      s."endDate",
      p.name as "currentPlan",
      p.code as "planCode",
      CASE 
        WHEN s."endDate" IS NULL OR s.status = 'CANCELLED' OR s.status = 'EXPIRED' OR (s.status = 'ACTIVE' AND s."endDate" < NOW()) THEN 0
        ELSE GREATEST(0, EXTRACT(DAY FROM s."endDate" - NOW())::integer)
      END as "remainingDays"
    FROM "Company" c
    LEFT JOIN latest_subs s ON c.id = s."companyId" AND s.rn = 1
    LEFT JOIN "SubscriptionPlan" p ON s."planId" = p.id
    WHERE ${whereSql}
    ORDER BY ${orderBySql}
    LIMIT ${limit} OFFSET ${offset}
  `;

  // 4. Count query for total matched records
  const countQuery = Prisma.sql`
    WITH latest_subs AS (
      SELECT *,
        ROW_NUMBER() OVER (PARTITION BY "companyId" ORDER BY "startDate" DESC) as rn
      FROM "CompanySubscription"
    )
    SELECT COUNT(*)::integer as count
    FROM "Company" c
    LEFT JOIN latest_subs s ON c.id = s."companyId" AND s.rn = 1
    LEFT JOIN "SubscriptionPlan" p ON s."planId" = p.id
    WHERE ${whereSql}
  `;

  // 5. Global summary stats query (not filtered by search/status/plan conditions)
  const summaryQuery = Prisma.sql`
    WITH latest_subs AS (
      SELECT *,
        ROW_NUMBER() OVER (PARTITION BY "companyId" ORDER BY "startDate" DESC) as rn
      FROM "CompanySubscription"
    )
    SELECT 
      COUNT(CASE WHEN computed_status = 'ACTIVE' THEN 1 END)::integer as active,
      COUNT(CASE WHEN computed_status = 'EXPIRED' THEN 1 END)::integer as expired,
      COUNT(CASE WHEN computed_status = 'TRIAL' THEN 1 END)::integer as trial,
      COUNT(CASE WHEN computed_status = 'CANCELLED' THEN 1 END)::integer as cancelled,
      COUNT(CASE WHEN computed_status = 'SUSPENDED' THEN 1 END)::integer as suspended,
      COUNT(CASE WHEN computed_status = 'ACTIVE' AND end_date >= NOW() AND end_date <= NOW() + INTERVAL '30 day' THEN 1 END)::integer as "expiringSoon"
    FROM (
      SELECT 
        CASE 
          WHEN s.status = 'ACTIVE' AND s."endDate" < NOW() THEN 'EXPIRED'
          ELSE COALESCE(s.status, 'EXPIRED')
        END as computed_status,
        s."endDate" as end_date
      FROM "Company" c
      LEFT JOIN latest_subs s ON c.id = s."companyId" AND s.rn = 1
      WHERE c."deletedAt" IS NULL
    ) t
  `;

  // Execute in parallel for maximum database efficiency
  const [items, countResult, summaryResult] = await Promise.all([
    prisma.$queryRaw<any[]>(itemsQuery),
    prisma.$queryRaw<{ count: number }[]>(countQuery),
    prisma.$queryRaw<any[]>(summaryQuery),
  ]);

  const total = countResult[0]?.count || 0;
  const totalPages = Math.ceil(total / pageSize);

  // 6. Bulk fetch enabled modules for the paginated page elements (avoids N+1)
  const companyIds = items.map((item) => item.id);
  const modulesList =
    companyIds.length > 0
      ? await prisma.companyModule.findMany({
          where: {
            companyId: { in: companyIds },
            isEnabled: true,
          },
          select: {
            companyId: true,
            moduleCode: true,
          },
        })
      : [];

  const modulesMap: Record<string, string[]> = {};
  modulesList.forEach((m) => {
    if (!modulesMap[m.companyId]) {
      modulesMap[m.companyId] = [];
    }
    modulesMap[m.companyId].push(m.moduleCode);
  });

  const itemsWithModules = items.map((item) => ({
    ...item,
    modules: modulesMap[item.id] || [],
  }));

  const summary = summaryResult[0] || {
    active: 0,
    expired: 0,
    trial: 0,
    cancelled: 0,
    suspended: 0,
    expiringSoon: 0,
  };

  return {
    summary,
    items: itemsWithModules,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}
