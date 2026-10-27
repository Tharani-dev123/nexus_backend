/** Canonical audit action + entity-type strings (Phase 14). */

export const AUDIT_ENTITY = {
  BRANCH: "Branch",
  SALARY_STRUCTURE: "SalaryStructure",
  SALARY_STRUCTURE_TEMPLATE: "SalaryStructureTemplate",
  PAYROLL_COMPONENT: "PayrollComponent",
  PAYROLL_RUN: "PayrollRun",
  PAYROLL_ENTRY: "PayrollEntry",
  SUBSCRIPTION_PLAN: "SubscriptionPlan",
  COMPANY_SUBSCRIPTION: "CompanySubscription",
  COMPANY_MODULE: "CompanyModule",
} as const;

export const AUDIT_ACTION = {
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  DELETED: "DELETED",
  MARKED: "MARKED",
  BULK_UPLOADED: "BULK_UPLOADED",
  LOCKED: "LOCKED",
  UNLOCKED: "UNLOCKED",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  REGULARIZED: "REGULARIZED",
  ACCRUED: "ACCRUED",
  ADJUSTED: "ADJUSTED",
  ENCASHED: "ENCASHED",
  REVISED: "REVISED",
  ASSIGNED: "ASSIGNED",
  PROCESSED: "PROCESSED",
  SUBSCRIBED: "SUBSCRIBED",
  ENABLED: "ENABLED",
  DISABLED: "DISABLED",
} as const;

export type AuditEntity = (typeof AUDIT_ENTITY)[keyof typeof AUDIT_ENTITY];
export type AuditActionType = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];
