import { describe, expect, it } from "vitest";

import { chatRequestSchema, healthResponseSchema } from "@/lib/api/contracts";

describe("chatRequestSchema", () => {
  it("defaults to streaming and accepts a minimal valid request", () => {
    const parsed = chatRequestSchema.parse({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(parsed.stream).toBe(true);
    expect(parsed.messages).toHaveLength(1);
  });

  it("rejects empty messages, unknown roles and extra fields", () => {
    expect(chatRequestSchema.safeParse({ messages: [] }).success).toBe(false);
    expect(
      chatRequestSchema.safeParse({
        messages: [{ role: "admin", content: "hi" }],
      }).success,
    ).toBe(false);
    expect(
      chatRequestSchema.safeParse({
        messages: [{ role: "user", content: "hi" }],
        apiKey: "should-not-be-sent-here",
      }).success,
    ).toBe(false);
  });

  it("bounds message count and token limits", () => {
    const tooMany = Array.from({ length: 51 }, () => ({
      role: "user" as const,
      content: "hi",
    }));
    expect(chatRequestSchema.safeParse({ messages: tooMany }).success).toBe(false);
    expect(
      chatRequestSchema.safeParse({
        messages: [{ role: "user", content: "hi" }],
        maxOutputTokens: 100_000,
      }).success,
    ).toBe(false);
  });
});

describe("healthResponseSchema", () => {
  it("validates the exact envelope produced by /api/health", () => {
    const payload = {
      ok: true,
      data: {
        status: "ok",
        version: "0.1.0",
        requestId: "req-1",
        timestamp: new Date().toISOString(),
        integrations: {
          ai: { state: "not_configured", configured: false },
          database: { state: "configured", configured: true },
        },
      },
      requestId: "req-1",
    };
    expect(healthResponseSchema.safeParse(payload).success).toBe(true);
  });
});
