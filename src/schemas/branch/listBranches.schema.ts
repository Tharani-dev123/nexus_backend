import { z } from "zod";

export const listBranchesSchema = z.object({
  query: z.object({
    companyId: z.string(),
    search: z.string().optional(),
    includeInactive: z.enum(["true", "false"]).optional(),
    sortBy: z.enum(["name", "code", "createdAt"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.coerce.number().int().optional(),
    pageSize: z.coerce.number().int().optional(),
  }),
});

export type ListBranchesQuery = z.infer<typeof listBranchesSchema>["query"];
