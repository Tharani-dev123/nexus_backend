import { z } from "zod";

/** Enable / disable a single module for the company. */
export const moduleAccessSchema = z.object({
  query: z.object({
    companyId: z.string(),
  }),
  body: z.object({
    moduleCode: z.string().min(1, "moduleCode is required"),
  }),
});

export type ModuleAccessInput = z.infer<typeof moduleAccessSchema>["body"];
