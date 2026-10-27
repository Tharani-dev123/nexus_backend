import AUDIT_REPO from "../../../database/audit/index.repo.js";
import { buildPagination, paginate } from "../../../utils/pagination.util.js";

export interface GetAuditLogsQuery {
  companyId: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: string;
  pageSize?: string;
}

export default async function getAuditLogs(query: GetAuditLogsQuery) {
  const { skip, take, page, pageSize } = buildPagination(query);

  const { items, total } = await AUDIT_REPO.getAuditLogs({
    companyId: query.companyId,
    entityType: query.entityType,
    entityId: query.entityId,
    userId: query.userId,
    action: query.action,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    skip,
    take,
  });

  return paginate(items, total, page, pageSize);
}
