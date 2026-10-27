import z from "zod";

import {
  emailSchema,
  OTPSchema,
  passwordSchema,
} from "../base/credentials.schema.js";

export const resetPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
    otp: OTPSchema,
    newPassword: passwordSchema,
  }),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
