import { z } from "zod";

export const chatRoleSchema = z.enum(["system", "user", "assistant"]);

export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string().trim().min(1).max(32_000),
});

export const chatRequestSchema = z.strictObject({
  messages: z.array(chatMessageSchema).min(1).max(50),
  /** Stream plain-text deltas, or return one JSON response. */
  stream: z.boolean().default(true),
  maxOutputTokens: z.number().int().min(1).max(32_000).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const integrationStateSchema = z.enum([
  "configured",
  "not_configured",
]);

export const healthResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    status: z.literal("ok"),
    version: z.string(),
    requestId: z.string(),
    timestamp: z.string(),
    integrations: z.object({
      ai: z.object({ state: integrationStateSchema, configured: z.boolean() }),
      database: z.object({
        state: integrationStateSchema,
        configured: z.boolean(),
      }),
    }),
  }),
  requestId: z.string(),
});
