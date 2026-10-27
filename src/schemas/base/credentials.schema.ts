import { z } from "zod";

export const emailSchema = z.email().min(3).max(254);
export const passwordSchema = z.string().min(8).max(72);

export const OTPSchema = z.string().min(6).max(6);
