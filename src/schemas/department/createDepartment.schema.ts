import { z } from "zod";

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Department name is required").max(100, "Department name cannot exceed 100 characters"),
    branchId: z.string().min(1, "Branch ID is required"),
  }),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>["body"];
