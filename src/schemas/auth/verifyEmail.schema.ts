import z from "zod";
import { emailSchema, OTPSchema } from "../base/credentials.schema.js";

export const verifyEmailConfirmSchema = z.object({
  body: z.object({
    email: emailSchema,
    otp: OTPSchema,
  }),
});

export type VerifyEmailConfirmInput = z.infer<
  typeof verifyEmailConfirmSchema
>["body"];
