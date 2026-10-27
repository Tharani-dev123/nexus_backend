import { z } from "zod";

export const subscribeSchema = z.object({
  query: z.object({
    companyId: z.string(),
  }),
  body: z.object({
    planCode: z.string().min(1, "planCode is required"),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>["body"];
