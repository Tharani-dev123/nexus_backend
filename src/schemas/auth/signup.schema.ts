import z from "zod";
import { emailSchema, passwordSchema } from "../base/credentials.schema.js";

export const signupSchema = z.object({
  body: z.object({
    email: emailSchema,
    name: z.string().min(1, "Name is required"),
    password: passwordSchema,
  }),
});

export type SignupInput = z.infer<typeof signupSchema>["body"];
