import { Prisma } from "@prisma/client";
import AUDIT_REPO from "../../../database/audit/index.repo.js";
import { requestContext } from "../../../context/requestContext.js";
import logger from "../../../config/logging/logger.config.js";

export interface RecordAuditInput {
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  /** Overrides — otherwise resolved from the async request context. */
  userId?: string;
  companyId?: string;
  /** Pass to tie the audit write to a surrounding transaction. */
  tx?: Prisma.TransactionClient;
}

/**
 * Writes an audit row, pulling actor / company / ip / user-agent from the async
 * request context when not provided. Audit failures are logged but never thrown
 * (auditing must not break the business operation) — except when a `tx` is given,
 * where the caller owns transactional consistency.
 */
export default async function recordAudit(input: RecordAuditInput): Promise<void> {
  const store = requestContext.getStore();
  const userId = input.userId ?? store?.user_id;
  const companyId = input.companyId ?? store?.company_id;

  if (!userId || !companyId) {
    logger.warn({
      msg: "recordAudit skipped: missing userId/companyId in context",
      action: input.action,
      entityType: input.entityType,
    });
    return;
  }

  const data = {
    userId,
    companyId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    oldValue: input.oldValue as Prisma.InputJsonValue | undefined,
    newValue: input.newValue as Prisma.InputJsonValue | undefined,
    ipAddress: store?.request_ip,
    userAgent: store?.userDeviceDetails?.userAgent ?? null,
  };

  if (input.tx) {
    await AUDIT_REPO.createAuditLog(data, input.tx);
    return;
  }

  try {
    await AUDIT_REPO.createAuditLog(data);
  } catch (err) {
    logger.error({ msg: "Failed to write audit log", action: input.action, err });
  }
}
