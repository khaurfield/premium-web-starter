import { z } from "zod";

export const chatRoleSchema = z.enum(["system", "user", "assistant"]);

export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  /** May be empty for an image-only turn; the request-level check enforces that
   * at least one of text or images carries real content. */
  content: z.string().trim().max(32_000),
});

/** Base64 payload only (no `data:` prefix). Bounded to keep requests sane. */
export const MAX_IMAGE_BASE64_LENGTH = 3_600_000;

export const imageMediaTypeSchema = z.enum([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export const imageAttachmentSchema = z.strictObject({
  kind: z.literal("image"),
  mediaType: imageMediaTypeSchema,
  data: z
    .string()
    .min(1)
    .max(MAX_IMAGE_BASE64_LENGTH)
    .regex(
      /^[A-Za-z0-9+/]+={0,2}$/,
      "Image data must be base64-encoded bytes without a data: prefix.",
    ),
  name: z.string().trim().min(1).max(200).optional(),
});

export type ImageAttachmentInput = z.infer<typeof imageAttachmentSchema>;

export const chatRequestSchema = z.strictObject({
  messages: z.array(chatMessageSchema).min(1).max(50),
  /** Stream plain-text deltas, or return one JSON response. */
  stream: z.boolean().default(true),
  maxOutputTokens: z.number().int().min(1).max(32_000).optional(),
  /** Must match an id from GET /api/models; defaults to the server model. */
  model: z.string().trim().min(1).max(200).optional(),
  /** Extra instructions appended to the server's base system prompt. */
  systemPrompt: z.string().trim().max(4_000).optional(),
  /** Real image parts forwarded to the provider; attached to the last user turn. */
  images: z.array(imageAttachmentSchema).max(4).optional(),
}).superRefine((value, ctx) => {
  const hasText = value.messages.some(
    (message) => message.content.trim().length > 0,
  );
  const hasImages = (value.images?.length ?? 0) > 0;
  if (!hasText && !hasImages) {
    ctx.addIssue({
      code: "custom",
      message: "A request needs message text or an image attachment.",
      path: ["messages"],
    });
  }
  if (hasImages && !value.messages.some((message) => message.role === "user")) {
    ctx.addIssue({
      code: "custom",
      message: "Image attachments require a user message.",
      path: ["images"],
    });
  }
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const modelInfoSchema = z.object({
  id: z.string(),
  label: z.string(),
  vision: z.boolean(),
});

/** Browser-safe model catalog. Contains ids/labels only, never credentials. */
export const modelCatalogSchema = z.object({
  configured: z.boolean(),
  providerName: z.string().nullable(),
  defaultModel: z.string().nullable(),
  models: z.array(modelInfoSchema),
  /** Names (never values) of missing server-side variables. */
  missing: z.array(z.string()),
});

export type ModelCatalog = z.infer<typeof modelCatalogSchema>;
export type ModelInfo = z.infer<typeof modelInfoSchema>;

/** JSON-mode completion returned by POST /api/chat. */
export const generatedChatSchema = z.object({
  text: z.string(),
  model: z.string(),
  finishReason: z.string(),
});

export const apiErrorEnvelopeSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  requestId: z.string().optional(),
});

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
