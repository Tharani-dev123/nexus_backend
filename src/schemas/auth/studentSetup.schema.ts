import { z } from "zod";
import { emailSchema, OTPSchema, passwordSchema } from "../base/credentials.schema.js";

export const requestStudentSetupSchema = z.object({ body: z.object({ email: emailSchema }) });
export const completeStudentSetupSchema = z.object({ body: z.object({ email: emailSchema, otp: OTPSchema, password: passwordSchema }) });
