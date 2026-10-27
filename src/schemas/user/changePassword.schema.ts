import { passwordSchema } from "../base/credentials.schema.js";
import z from "zod";

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  }),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];
