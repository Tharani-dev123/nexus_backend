/**
 * Product module catalogue + cross-module integration rules.
 *
 * The `ProductModule` enum is the single source of truth for company products.
 */

import { ProductModule } from "@prisma/client";

export const PRODUCT_MODULE = {
  COMPLIANCE: "COMPLIANCE",
} as const satisfies Record<string, ProductModule>;

export const PRODUCT_MODULES: readonly ProductModule[] =
  Object.values(PRODUCT_MODULE);

/** Narrowing guard for untrusted module-code input (params/body). */
export function isProductModule(value: unknown): value is ProductModule {
  return (
    typeof value === "string" &&
    (PRODUCT_MODULES as readonly string[]).includes(value)
  );
}


