import { chatRequestSchema } from "@/lib/api/contracts";
import { jsonOk, withApiRoute } from "@/lib/api/response";
import { toModelMessages } from "@/lib/ai/messages";
import { resolveModel } from "@/lib/ai/models";
import { generateChat, streamChat } from "@/lib/ai/provider";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Real AI endpoint. With `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` set, every
 * response comes from the configured OpenAI-compatible provider. Without them,
 * the route returns a typed 503 (`AI_NOT_CONFIGURED`) — never canned text.
 *
 * Body: { messages: [{ role, content }], stream?, maxOutputTokens?, model?,
 *         systemPrompt?, images? }
 * `stream: true` (default) → `text/plain; charset=utf-8` delta stream.
 * `stream: false` → JSON envelope containing the provider's completion.
 * `model` is checked against the server allow-list from GET /api/models.
 * `images` are real provider image parts, not client-side decoration.
 */
export const POST = withApiRoute(
  async ({ request, requestId, logger }) => {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw new AppError({
        code: "BAD_REQUEST",
        message: "Request body must be valid JSON.",
        expose: true,
      });
    }

    const parsed = chatRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Invalid chat request.",
        expose: true,
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const images = parsed.data.images ?? [];
    if (
      images.length > 0 &&
      !parsed.data.messages.some((message) => message.role === "user")
    ) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Image attachments require a user message.",
        expose: true,
      });
    }

    const model = resolveModel(parsed.data.model);
    const messages = toModelMessages(parsed.data.messages, images);
    const callOptions = {
      signal: request.signal,
      maxOutputTokens: parsed.data.maxOutputTokens,
      model,
      systemPrompt: parsed.data.systemPrompt,
      logger,
    };

    if (parsed.data.stream) {
      return streamChat(messages, callOptions);
    }

    const result = await generateChat(messages, callOptions);
    logger.info("chat.completed", { model: result.model, requestId });
    return jsonOk(result, requestId);
  },
  { route: "api.chat" },
);
