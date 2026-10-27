import z from "zod";

export const revokeSessionSchema = z.object({
  body: z.object({
    sessionId: z.string(),
  }),
});

export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>["body"];
