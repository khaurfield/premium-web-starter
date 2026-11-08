import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateChat, streamChat } from "@/lib/ai/provider";
import { resetServerEnvCache } from "@/lib/env";
import { toModelMessages } from "@/lib/ai/messages";

const KEYS = [
  "AI_BASE_URL",
  "AI_API_KEY",
  "AI_MODEL",
  "AI_PROVIDER_NAME",
  "AI_MAX_OUTPUT_TOKENS",
  "AI_REQUEST_TIMEOUT_MS",
] as const;

const messages = toModelMessages([{ role: "user", content: "Hello" }]);

function openAIJsonResponse(content: string): Response {
  return new Response(
    JSON.stringify({
      id: "chatcmpl-test",
      object: "chat.completion",
      created: 1_700_000_000,
      model: "example-model",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

beforeEach(() => {
  resetServerEnvCache();
  for (const key of KEYS) vi.stubEnv(key, "");
  vi.stubEnv("AI_BASE_URL", "https://provider.example/v1");
  vi.stubEnv("AI_API_KEY", "test-provider-key-123456");
  vi.stubEnv("AI_MODEL", "example-model");
  resetServerEnvCache();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetServerEnvCache();
});

describe("AI provider integration", () => {
  it("calls a real OpenAI-compatible endpoint and returns its text", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        openAIJsonResponse("Real provider output"),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateChat(messages);

    expect(result).toMatchObject({
      text: "Real provider output",
      model: "example-model",
      finishReason: "stop",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const firstCall = fetchMock.mock.calls[0];
    const input = firstCall?.[0];
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input instanceof Request
            ? input.url
            : String(input);
    expect(url).toContain("provider.example/v1/chat/completions");
    const init = firstCall?.[1];
    expect(String(JSON.stringify(init?.headers ?? {}))).toContain(
      "test-provider-key-123456",
    );
  });

  it("passes streamed provider deltas through unchanged", async () => {
    const chunk = (content: string, finishReason: string | null) =>
      `data: ${JSON.stringify({
        id: "chatcmpl-stream-test",
        object: "chat.completion.chunk",
        created: 1_700_000_000,
        model: "example-model",
        choices: [
          {
            index: 0,
            delta: { role: "assistant", content },
            finish_reason: finishReason,
          },
        ],
      })}\n\n`;

    const sse =
      chunk("Streamed ", null) +
      chunk("provider text", "stop") +
      "data: [DONE]\n\n";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(sse, {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        }),
      ),
    );

    const response = streamChat(messages);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toBe("Streamed provider text");
  });

  it("maps an upstream failure to AI_UPSTREAM_ERROR", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("upstream unavailable", { status: 503 }),
      ),
    );

    await expect(generateChat(messages)).rejects.toMatchObject({
      code: "AI_UPSTREAM_ERROR",
      status: 502,
    });
  });

  it("refuses to stream without credentials rather than inventing text", () => {
    vi.stubEnv("AI_API_KEY", "");
    resetServerEnvCache();
    expect(() => streamChat(messages)).toThrow(/AI provider is not configured/);
  });
});

describe("toModelMessages", () => {
  it("maps every supported role to an AI SDK model message", () => {
    expect(
      toModelMessages([
        { role: "system", content: "rules" },
        { role: "user", content: "question" },
        { role: "assistant", content: "answer" },
      ]),
    ).toEqual([
      { role: "system", content: "rules" },
      { role: "user", content: "question" },
      { role: "assistant", content: "answer" },
    ]);
  });
});
