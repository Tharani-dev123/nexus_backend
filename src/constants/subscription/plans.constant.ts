/**
 * Subscription plan catalogue. A plan is a sellable bundle of ProductModules.
 * Single-module plans cover companies that buy exactly one product; FULL_SUITE
 * grants everything. Activating a plan provisions the modules listed here as
 * CompanyModule rows (see subscription services).
 *
 * Prices are illustrative defaults seeded into SubscriptionPlan and editable
 * afterwards via the plan-management endpoints.
 */

import { ProductModule } from "@prisma/client";
import { PRODUCT_MODULES } from "./modules.constant.js";

export const PLAN_CODE = {
  COMPLIANCE: "COMPLIANCE",
  FULL_SUITE: "FULL_SUITE",
} as const;

export type PlanCode = (typeof PLAN_CODE)[keyof typeof PLAN_CODE];

/** Plan code → the modules it grants. The access-resolution source of truth. */
export const PLAN_MODULES: Record<PlanCode, ProductModule[]> = {
  COMPLIANCE: ["COMPLIANCE"],

  FULL_SUITE: [...PRODUCT_MODULES],
};

export interface SubscriptionPlanSeed {
  code: PlanCode;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
}

export const SUBSCRIPTION_PLAN_SEED: readonly SubscriptionPlanSeed[] = [
  { code: "FULL_SUITE", name: "Full Suite", description: "Every available module.", monthlyPrice: 2000, annualPrice: 20000 },
  { code: "COMPLIANCE", name: "Compliance", description: "Statutory compliance management.", monthlyPrice: 1500, annualPrice: 15000 },
];

/** Resolve a plan code to its module set; null when the code is unknown. */
export function modulesForPlan(code: string): ProductModule[] | null {
  return PLAN_MODULES[code as PlanCode] ?? null;
}
