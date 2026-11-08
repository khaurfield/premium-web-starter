import { describe, expect, it, vi } from "vitest";

import {
  createLogger,
  redact,
  serializeError,
  type LogRecord,
} from "@/lib/logging/logger";

describe("redact", () => {
  it("masks secret-looking keys at any depth", () => {
    const value = {
      provider: { apiKey: "sk-FAKE-REDACTION-FIXTURE", nested: { service_role_key: "secret" } },
      headers: { Authorization: "Bearer 1234567890abcdef" },
      safe: "visible",
    };

    expect(redact(value)).toEqual({
      provider: { apiKey: "[REDACTED]", nested: { service_role_key: "[REDACTED]" } },
      headers: { Authorization: "[REDACTED]" },
      safe: "visible",
    });
  });

  it("masks secret-looking string values and handles cycles", () => {
    const cyclic: Record<string, unknown> = { name: "root" };
    cyclic.self = cyclic;

    expect(redact({ key: "sk-FAKE-REDACTION-FIXTURE", cyclic })).toMatchObject({
      key: "[REDACTED]",
      cyclic: { name: "root", self: "[Circular]" },
    });
  });

  it("leaves primitive values untouched", () => {
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBeNull();
    expect(redact("ordinary text")).toBe("ordinary text");
  });
});

describe("createLogger", () => {
  it("emits one structured JSON record with correlation fields", () => {
    const sink = vi.fn<(record: LogRecord) => void>();
    const logger = createLogger({
      sink,
      level: "debug",
      requestId: "req-123",
      component: "test",
    });

    logger.info("hello", { userId: "u-1" });

    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0]?.[0]).toMatchObject({
      level: "info",
      message: "hello",
      requestId: "req-123",
      component: "test",
      userId: "u-1",
    });
    expect(typeof sink.mock.calls[0]?.[0]?.timestamp).toBe("string");
  });

  it("honours the minimum level", () => {
    const sink = vi.fn<(record: LogRecord) => void>();
    const logger = createLogger({ sink, level: "warn" });

    logger.debug("hidden");
    logger.info("also hidden");
    logger.error("visible");

    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0]?.[0]?.message).toBe("visible");
  });

  it("never logs raw secrets through a child logger", () => {
    const sink = vi.fn<(record: LogRecord) => void>();
    const logger = createLogger({ sink, level: "info" }).child({
      requestId: "req-9",
    });

    logger.info("provider call", { apiKey: "sk-FAKE-REDACTION-FIXTURE" });

    expect(sink.mock.calls[0]?.[0]).toMatchObject({
      requestId: "req-9",
      apiKey: "[REDACTED]",
    });
  });
});

describe("serializeError", () => {
  it("produces a compact, secret-safe shape", () => {
    expect(serializeError(new TypeError("bad input"))).toEqual({
      name: "TypeError",
      message: "bad input",
    });
    expect(serializeError("oops")).toEqual({ message: "oops" });
  });
});
