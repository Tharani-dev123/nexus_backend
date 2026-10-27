import z from "zod";
import { emailSchema, passwordSchema } from "../base/credentials.schema.js";

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];
