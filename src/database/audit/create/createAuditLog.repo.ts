import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";

export interface CreateAuditLogData {
  userId: string;
  companyId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export default async function createAuditLog(
  data: CreateAuditLogData,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.auditLog.create({
    data: {
      userId: data.userId,
      companyId: data.companyId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      oldValue: data.oldValue,
      newValue: data.newValue,
      ipAddress: data.ipAddress ?? undefined,
      userAgent: data.userAgent ?? undefined,
    },
  });
}
