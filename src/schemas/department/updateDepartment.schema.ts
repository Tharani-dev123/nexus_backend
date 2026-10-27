import { z } from "zod";
import { createDepartmentSchema } from "./createDepartment.schema.js";

export const updateDepartmentSchema = z.object({
  body: createDepartmentSchema.shape.body.partial().extend({
    branchId: z.string().min(1, "Branch ID cannot be empty").optional(),
  }),
});

export type UpdateDepartmentInput =
  z.infer<typeof updateDepartmentSchema>["body"];
