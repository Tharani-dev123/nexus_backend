import z from "zod";

import { emailSchema } from "../base/credentials.schema.js";

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
