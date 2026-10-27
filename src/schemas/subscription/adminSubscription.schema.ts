import { z } from "zod";

const durationMonthsSchema = z.preprocess(
  (val) => (typeof val === "string" ? parseInt(val, 10) : val),
  z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12), z.literal(24)]),
);

const paymentModeSchema = z.enum(["UPI", "BANK_TRANSFER", "CHEQUE", "CASH", "INVOICE"]);

export const activateSubscriptionSchema = z.object({
  body: z.object({
    companyId: z.string().uuid("companyId must be a valid UUID"),
    planCode: z.string().min(1, "planCode is required"),
    durationMonths: durationMonthsSchema,
    paymentReference: z.string().optional(),
    paymentMode: paymentModeSchema.optional(),
    amount: z.coerce.number().positive("amount must be positive").optional(),
    currency: z.string().min(1, "currency code cannot be empty").optional(),
    invoiceNumber: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const renewSubscriptionSchema = z.object({
  body: z.object({
    companyId: z.string().uuid("companyId must be a valid UUID"),
    durationMonths: durationMonthsSchema,
    paymentReference: z.string().optional(),
    paymentMode: paymentModeSchema.optional(),
    amount: z.coerce.number().positive("amount must be positive").optional(),
    currency: z.string().min(1, "currency code cannot be empty").optional(),
    invoiceNumber: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const cancelSubscriptionSchema = z.object({
  body: z.object({
    companyId: z.string().uuid("companyId must be a valid UUID"),
    reason: z.string().min(1, "Reason is required"),
  }),
});

export const changePlanSubscriptionSchema = z.object({
  body: z.object({
    companyId: z.string().uuid("companyId must be a valid UUID"),
    planCode: z.string().min(1, "planCode is required"),
    reason: z.string().min(1, "Reason is required"),
  }),
});

export const suspendSubscriptionSchema = z.object({
  body: z.object({
    companyId: z.string().uuid("companyId must be a valid UUID"),
    reason: z.string().min(1, "Reason is required"),
  }),
});

export const reactivateSubscriptionSchema = z.object({
  body: z.object({
    companyId: z.string().uuid("companyId must be a valid UUID"),
  }),
});

export type ActivateSubscriptionInput = z.infer<typeof activateSubscriptionSchema>["body"];
export type RenewSubscriptionInput = z.infer<typeof renewSubscriptionSchema>["body"];
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>["body"];
export type ChangePlanSubscriptionInput = z.infer<typeof changePlanSubscriptionSchema>["body"];
export type SuspendSubscriptionInput = z.infer<typeof suspendSubscriptionSchema>["body"];
export type ReactivateSubscriptionInput = z.infer<typeof reactivateSubscriptionSchema>["body"];
