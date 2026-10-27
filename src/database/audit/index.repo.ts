import createAuditLog from "./create/createAuditLog.repo.js";
import getAuditLogs from "./get/getAuditLogs.repo.js";

const AUDIT_REPO = {
  createAuditLog,
  getAuditLogs,
};

export default AUDIT_REPO;
