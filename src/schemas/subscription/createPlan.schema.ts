import { z } from "zod";

export const createPlanSchema = z.object({
  query: z.object({
    companyId: z.string(),
  }),
  body: z.object({
    code: z
      .string()
      .min(1, "Plan code is required")
      .regex(/^[A-Z0-9_]+$/, "Plan code must be UPPER_SNAKE_CASE"),
    name: z.string().min(1, "Plan name is required"),
    description: z.string().optional(),
    monthlyPrice: z.coerce.number().nonnegative().optional(),
    annualPrice: z.coerce.number().nonnegative().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>["body"];
