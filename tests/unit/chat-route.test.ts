import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/chat/route";
import { generateChat, streamChat } from "@/lib/ai/provider";
import { resetServerEnvCache } from "@/lib/env";

/**
 * Keep the real implementations as the default (so the unconfigured 503 path
 * is genuinely exercised) while allowing individual tests to stub the network
 * boundary. No canned assistant text is ever produced by the application.
 */
vi.mock("@/lib/ai/provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/provider")>();
  return {
    ...actual,
    generateChat: vi.fn(actual.generateChat),
    streamChat: vi.fn(actual.streamChat),
  };
});

const KEYS = [
  "AI_BASE_URL",
  "AI_API_KEY",
  "AI_MODEL",
  "AI_MAX_OUTPUT_TOKENS",
  "AI_REQUEST_TIMEOUT_MS",
] as const;

function chatRequest(body: unknown): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  messages: [{ role: "user", content: "Hello" }],
  stream: false,
};

beforeEach(() => {
  resetServerEnvCache();
  for (const key of KEYS) vi.stubEnv(key, "");
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetServerEnvCache();
});

describe("POST /api/chat", () => {
  it("rejects a non-JSON body", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: "not json",
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "BAD_REQUEST" },
    });
  });

  it("rejects an invalid payload", async () => {
    const response = await POST(chatRequest({ messages: [] }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("returns a typed 503 instead of a fabricated answer when unconfigured", async () => {
    const response = await POST(chatRequest(validBody));
    expect(response.status).toBe(503);
    const payload: unknown = await response.json();
    expect(payload).toMatchObject({
      ok: false,
      error: { code: "AI_NOT_CONFIGURED" },
    });
    expect(JSON.stringify(payload)).not.toContain("assistant");
  });

  it("also refuses to stream when unconfigured", async () => {
    const response = await POST(
      chatRequest({
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      }),
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "AI_NOT_CONFIGURED" },
    });
  });

  it("returns the real provider result in JSON mode", async () => {
    vi.stubEnv("AI_BASE_URL", "https://api.example.com/v1");
    vi.stubEnv("AI_API_KEY", "sk-test-key-123456789");
    vi.stubEnv("AI_MODEL", "example-model");
    resetServerEnvCache();
    vi.mocked(generateChat).mockResolvedValueOnce({
      text: "provider output",
      model: "example-model",
      finishReason: "stop",
    });

    const response = await POST(chatRequest(validBody));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { text: "provider output", model: "example-model" },
    });
  });

  it("passes the provider text stream through unchanged", async () => {
    vi.stubEnv("AI_BASE_URL", "https://api.example.com/v1");
    vi.stubEnv("AI_API_KEY", "sk-test-key-123456789");
    vi.stubEnv("AI_MODEL", "example-model");
    resetServerEnvCache();
    vi.mocked(streamChat).mockReturnValueOnce(
      new Response("provider delta", {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      }),
    );

    const response = await POST(
      chatRequest({
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("provider delta");
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });
});
