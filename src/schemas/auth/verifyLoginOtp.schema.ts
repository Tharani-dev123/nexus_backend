import z from "zod";
import { emailSchema, OTPSchema } from "../base/credentials.schema.js";

export const verifyLoginOtpSchema = z.object({
  body: z.object({
    email: emailSchema,
    otp: OTPSchema,
  }),
});

export type VerifyLoginOtpInput = z.infer<typeof verifyLoginOtpSchema>["body"];
