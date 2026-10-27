import z from "zod";
import { passwordSchema } from "../base/credentials.schema.js";

export const deleteUserSchema = z.object({
  body: z.object({ password: passwordSchema }),
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>["body"];
