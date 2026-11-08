import { AppError, toAppError } from "@/lib/errors";
import {
  createLogger,
  serializeError,
  type Logger,
} from "@/lib/logging/logger";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  requestId: string;
}

export interface ApiFailure {
  ok: false;
  error: { code: string; message: string; details?: unknown };
  requestId: string;
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

/** Reuse a caller-supplied correlation id when it is safe to echo back. */
export function getRequestId(request: Request): string {
  const candidate = request.headers.get("x-request-id");
  return candidate && REQUEST_ID_PATTERN.test(candidate)
    ? candidate
    : crypto.randomUUID();
}

/** Only log the path, never the query string (it may contain credentials). */
function safePath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return "unknown";
  }
}

function baseHeaders(requestId: string, init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set("cache-control", "no-store");
  headers.set("x-request-id", requestId);
  return headers;
}

export function jsonOk<T>(
  data: T,
  requestId: string,
  init: { status?: number; headers?: HeadersInit } = {},
): Response {
  const headers = baseHeaders(requestId, init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  const body: ApiSuccess<T> = { ok: true, data, requestId };
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}

export function jsonError(error: AppError, requestId: string): Response {
  const headers = baseHeaders(requestId);
  headers.set("content-type", "application/json; charset=utf-8");
  const body: ApiFailure = { ok: false, error: error.toSafeJSON(), requestId };
  return new Response(JSON.stringify(body), { status: error.status, headers });
}

/** Attach correlation/cache headers to responses produced by a handler. */
export function withRequestHeaders(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-request-id", requestId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export interface ApiRouteContext {
  request: Request;
  requestId: string;
  logger: Logger;
}

export type ApiRouteHandler = (
  context: ApiRouteContext,
) => Promise<Response> | Response;

/**
 * Uniform API boundary: correlation ids, structured logs, secret-safe error
 * translation, and consistent JSON envelopes for every route.
 */
export function withApiRoute(
  handler: ApiRouteHandler,
  options: { route?: string } = {},
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const requestId = getRequestId(request);
    const logger = createLogger({
      requestId,
      component: options.route ?? "api",
    });
    const path = safePath(request.url);
    const startedAt = Date.now();

    logger.debug("request.started", { method: request.method, path });

    try {
      const response = await handler({ request, requestId, logger });
      logger.info("request.completed", {
        method: request.method,
        path,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return withRequestHeaders(response, requestId);
    } catch (cause) {
      const error = toAppError(cause);
      logger.error("request.failed", {
        method: request.method,
        path,
        status: error.status,
        code: error.code,
        durationMs: Date.now() - startedAt,
        error: serializeError(error),
      });
      return jsonError(error, requestId);
    }
  };
}
