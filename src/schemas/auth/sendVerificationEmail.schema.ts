import z from "zod";
import { emailSchema } from "../base/credentials.schema.js";

export const sendVerificationEmailSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export type SendVerificationEmailInput = z.infer<
  typeof sendVerificationEmailSchema
>["body"];
