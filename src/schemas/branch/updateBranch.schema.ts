import { z } from "zod";

export const updateBranchSchema = z.object({
  query: z.object({ id: z.string().min(1, "Branch id is required") }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    addressLine: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    pinCode: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>["body"];
