import z from "zod";
import { emailSchema } from "../base/credentials.schema.js";

export const requestLoginOtpSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export type RequestLoginOtpInput = z.infer<
  typeof requestLoginOtpSchema
>["body"];
