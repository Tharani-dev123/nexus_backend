import { z } from "zod";

export const createBranchSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Branch name is required"),
    code: z.string().min(1, "Branch code is required"),
    addressLine: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pinCode: z.string().optional(),
  }),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>["body"];
