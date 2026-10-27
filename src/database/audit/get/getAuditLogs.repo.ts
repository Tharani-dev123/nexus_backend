import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export interface AuditLogFilter {
  companyId: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  from?: Date;
  to?: Date;
  skip: number;
  take: number;
}

function buildWhere(filter: AuditLogFilter): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = { companyId: filter.companyId };
  if (filter.entityType) where.entityType = filter.entityType;
  if (filter.entityId) where.entityId = filter.entityId;
  if (filter.userId) where.userId = filter.userId;
  if (filter.action) where.action = filter.action;
  if (filter.from || filter.to) {
    where.createdAt = {};
    if (filter.from) where.createdAt.gte = filter.from;
    if (filter.to) where.createdAt.lte = filter.to;
  }
  return where;
}

export default async function getAuditLogs(
  filter: AuditLogFilter,
  tx: Prisma.TransactionClient = prisma,
) {
  const where = buildWhere(filter);
  const [items, total] = await Promise.all([
    tx.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filter.skip,
      take: filter.take,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    tx.auditLog.count({ where }),
  ]);
  return { items, total };
}
