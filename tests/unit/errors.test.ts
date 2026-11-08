import { describe, expect, it } from "vitest";
import { z } from "zod";

import { AppError, isAppError, toAppError } from "@/lib/errors";

describe("AppError", () => {
  it("derives the status from the code and hides internal messages", () => {
    const error = new AppError({
      code: "INTERNAL_ERROR",
      message: "database password leaked in a stack trace",
    });

    expect(error.status).toBe(500);
    expect(error.expose).toBe(false);
    expect(error.toSafeJSON()).toEqual({
      code: "INTERNAL_ERROR",
      message: "Internal server error.",
    });
  });

  it("returns exposed messages and validation details to the caller", () => {
    const error = new AppError({
      code: "BAD_REQUEST",
      message: "Body must be JSON",
      expose: true,
      details: { hint: "send application/json" },
    });

    expect(error.status).toBe(400);
    expect(error.toSafeJSON()).toEqual({
      code: "BAD_REQUEST",
      message: "Body must be JSON",
      details: { hint: "send application/json" },
    });
  });

  it("keeps the original cause", () => {
    const cause = new Error("root cause");
    const error = new AppError({
      code: "AI_UPSTREAM_ERROR",
      message: "provider failed",
      expose: true,
      cause,
    });
    expect(error.cause).toBe(cause);
    expect(isAppError(error)).toBe(true);
  });
});

describe("toAppError", () => {
  it("passes AppError instances through unchanged", () => {
    const original = new AppError({
      code: "AI_NOT_CONFIGURED",
      message: "not configured",
      expose: true,
    });
    expect(toAppError(original)).toBe(original);
  });

  it("converts a ZodError into a detailed validation error", () => {
    const schema = z.object({ name: z.string() });
    const parsed = schema.safeParse({});
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const error = toAppError(parsed.error);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.status).toBe(400);
    expect(error.expose).toBe(true);
    expect(error.toSafeJSON().details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "name" }),
      ]),
    );
  });

  it("maps aborts to a timeout and unknown values to a hidden 500", () => {
    const timeout = new Error("cancelled");
    timeout.name = "AbortError";
    expect(toAppError(timeout).code).toBe("TIMEOUT");
    expect(toAppError(timeout).status).toBe(504);

    const unknown = toAppError("a string was thrown");
    expect(unknown.code).toBe("INTERNAL_ERROR");
    expect(unknown.expose).toBe(false);
  });
});
