import { describe, expect, it, vi } from "vitest";

import {
  getRequestId,
  jsonError,
  jsonOk,
  withApiRoute,
} from "@/lib/api/response";
import { AppError } from "@/lib/errors";

describe("getRequestId", () => {
  it("reuses a safe caller-supplied correlation id", () => {
    const request = new Request("http://localhost/api/health", {
      headers: { "x-request-id": "phone-session-42" },
    });
    expect(getRequestId(request)).toBe("phone-session-42");
  });

  it("generates a fresh id for missing or unsafe values", () => {
    expect(getRequestId(new Request("http://localhost/"))).toMatch(/^[0-9a-f-]{36}$/);
    const unsafe = new Request("http://localhost/", {
      headers: { "x-request-id": "token=secret value" },
    });
    expect(getRequestId(unsafe)).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("JSON envelopes", () => {
  it("wraps success data and sets no-store headers", async () => {
    const response = jsonOk({ value: 1 }, "req-1");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-request-id")).toBe("req-1");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { value: 1 },
      requestId: "req-1",
    });
  });

  it("never exposes internal error messages", async () => {
    const response = jsonError(
      new AppError({ code: "INTERNAL_ERROR", message: "raw secret detail" }),
      "req-2",
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error." },
      requestId: "req-2",
    });
  });
});

describe("withApiRoute", () => {
  it("returns the handler response with correlation headers", async () => {
    const handler = withApiRoute(
      ({ requestId }) => jsonOk({ requestId }, requestId),
      { route: "test" },
    );
    const response = await handler(new Request("http://localhost/test"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("converts thrown errors into typed JSON responses", async () => {
    const handler = withApiRoute(() => {
      throw new AppError({
        code: "BAD_REQUEST",
        message: "invalid",
        expose: true,
      });
    });
    const response = await handler(new Request("http://localhost/test"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "BAD_REQUEST", message: "invalid" },
    });
  });

  it("never logs the query string", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const handler = withApiRoute(() => new Response("ok"), { route: "test" });
    await handler(
      new Request("http://localhost/test?api_key=sk-should-not-be-logged"),
    );
    const output = spy.mock.calls.flat().join(" ");
    expect(output).not.toContain("sk-should-not-be-logged");
    expect(output).toContain('"path":"/test"');
    spy.mockRestore();
  });
});
