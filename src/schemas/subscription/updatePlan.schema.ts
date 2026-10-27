import { z } from "zod";

export const updatePlanSchema = z.object({
  query: z.object({
    companyId: z.string(),
    planId: z.string().min(1, "planId is required"),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    monthlyPrice: z.coerce.number().nonnegative().optional(),
    annualPrice: z.coerce.number().nonnegative().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>["body"];
