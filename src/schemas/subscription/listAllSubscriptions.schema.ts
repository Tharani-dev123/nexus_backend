import { z } from "zod";

export const listAllSubscriptionsSchema = z.object({
  query: z.object({
    page: z.preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.number().int().positive().default(1),
    ),
    pageSize: z.preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.number().int().positive().default(20),
    ),
    search: z.string().optional(),
    status: z.enum(["ACTIVE", "EXPIRED", "TRIAL", "SUSPENDED", "CANCELLED", "GRACE_PERIOD"]).optional(),
    plan: z.string().optional(),
    module: z.string().optional(),
    expiresWithin: z.preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.number().int().positive().optional(),
    ),
    sortBy: z.enum(["name", "plan", "startDate", "endDate", "remainingDays"]).default("name"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),
});

export type ListAllSubscriptionsInput = z.infer<typeof listAllSubscriptionsSchema>["query"];
