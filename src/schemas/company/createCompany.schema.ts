import { z } from "zod";

export const createCompanySchema = z.object({
  body: z.object({
    name: z.string(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
  }),
});

export type CreateCompanyInput =
  z.infer<typeof createCompanySchema>["body"];
