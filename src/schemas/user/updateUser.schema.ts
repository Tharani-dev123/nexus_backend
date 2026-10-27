import z from "zod";

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
  }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];
