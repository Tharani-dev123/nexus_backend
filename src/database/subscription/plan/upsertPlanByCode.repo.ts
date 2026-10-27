import { Prisma } from "@prisma/client";
import prisma from "../../index.db.js";
import { CreatePlanData } from "./createPlan.repo.js";

/** Idempotent plan write keyed on the stable `code` — used by the seeder. */
export default async function upsertPlanByCode(
  data: CreatePlanData,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.subscriptionPlan.upsert({
    where: { code: data.code },
    update: {
      name: data.name,
      description: data.description ?? null,
      monthlyPrice: data.monthlyPrice ?? 0,
      annualPrice: data.annualPrice ?? 0,
      isActive: data.isActive ?? true,
    },
    create: {
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      monthlyPrice: data.monthlyPrice ?? 0,
      annualPrice: data.annualPrice ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}
