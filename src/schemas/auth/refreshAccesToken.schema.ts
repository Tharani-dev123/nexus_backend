import z from "zod";

export const RefreshAccessTokenInputSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export type RefreshAccessTokenInput = z.infer<
  typeof RefreshAccessTokenInputSchema
>["body"];
