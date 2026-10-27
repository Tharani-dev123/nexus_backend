import { z } from "zod";
import { createCompanySchema } from "./createCompany.schema.js";

export const updateCompanySchema = z.object({
  body: createCompanySchema.shape.body.partial(),
});

export type CompanyUpdateInput =
  z.infer<typeof updateCompanySchema>["body"];