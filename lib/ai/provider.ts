import "server-only";

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  createTextStreamResponse,
  generateText,
  streamText,
  toTextStream,
  type LanguageModel,
  type ModelMessage,
} from "ai";

import { requireAIConfig, type AIConfig } from "@/lib/ai/config";
import { AppError } from "@/lib/errors";
import type { Logger } from "@/lib/logging/logger";
import { serializeError } from "@/lib/logging/logger";

const SYSTEM_PROMPT =
  "You are a concise, accurate personal assistant. State uncertainty plainly; never invent facts.";

export interface ChatCallOptions {
  signal?: AbortSignal;
  maxOutputTokens?: number;
  logger?: Logger;
}

export interface GeneratedChat {
  text: string;
  model: string;
  finishReason: string;
}

/** One place that knows how to talk to the configured OpenAI-compatible API. */
function createModel(config: AIConfig): LanguageModel {
  const provider = createOpenAICompatible({
    name: config.providerName,
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });
  return provider.chatModel(config.model);
}

/** Combine client cancellation with a hard server-side timeout. */
function withTimeout(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new DOMException("AI provider timeout", "TimeoutError"));
  }, timeoutMs);
  timer.unref?.();

  controller.signal.addEventListener("abort", () => clearTimeout(timer), {
    once: true,
  });

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", () => controller.abort(signal.reason), {
        once: true,
      });
    }
  }

  return controller.signal;
}

/** Non-streaming completion. Always performs a real provider request. */
export async function generateChat(
  messages: ModelMessage[],
  options: ChatCallOptions = {},
): Promise<GeneratedChat> {
  const config = requireAIConfig();
  const model = createModel(config);

  try {
    const result = await generateText({
      model,
      messages,
      system: SYSTEM_PROMPT,
      maxOutputTokens: options.maxOutputTokens ?? config.maxOutputTokens,
      maxRetries: 1,
      abortSignal: withTimeout(options.signal, config.timeoutMs),
    });

    options.logger?.info("ai.completed", {
      model: config.model,
      finishReason: result.finishReason,
      promptTokens: result.totalUsage?.inputTokens,
      completionTokens: result.totalUsage?.outputTokens,
    });

    return {
      text: result.text,
      model: config.model,
      finishReason: result.finishReason,
    };
  } catch (cause) {
    options.logger?.error("ai.upstream_error", {
      model: config.model,
      error: serializeError(cause),
    });
    throw new AppError({
      code: "AI_UPSTREAM_ERROR",
      message: "The AI provider request failed.",
      expose: true,
      cause,
    });
  }
}

/**
 * Streaming completion as a plain UTF-8 text stream. No canned text is ever
 * produced: deltas come straight from the provider response.
 */
export function streamChat(
  messages: ModelMessage[],
  options: ChatCallOptions = {},
): Response {
  const config = requireAIConfig();
  const model = createModel(config);

  const result = streamText({
    model,
    messages,
    system: SYSTEM_PROMPT,
    maxOutputTokens: options.maxOutputTokens ?? config.maxOutputTokens,
    maxRetries: 1,
    abortSignal: withTimeout(options.signal, config.timeoutMs),
    onError: ({ error }) => {
      options.logger?.error("ai.stream_error", {
        model: config.model,
        error: serializeError(error),
      });
    },
  });

  return createTextStreamResponse({
    stream: toTextStream({ stream: result.stream }),
    headers: {
      "X-AI-Provider": config.providerName,
    },
  });
}
