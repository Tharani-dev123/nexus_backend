import recordAudit from "./record/recordAudit.service.js";
import getAuditLogs from "./get/getAuditLogs.service.js";

const AUDIT_SERVICE = {
  recordAudit,
  getAuditLogs,
};

export default AUDIT_SERVICE;
