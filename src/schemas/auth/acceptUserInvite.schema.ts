import z from "zod";
import { passwordSchema } from "../base/credentials.schema.js";

export const acceptUserInviteSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: passwordSchema,
  }),
});

export type AcceptUserInviteInput = z.infer<
  typeof acceptUserInviteSchema
>["body"];
