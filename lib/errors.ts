import { ZodError } from "zod";

export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "AI_NOT_CONFIGURED"
  | "AI_UPSTREAM_ERROR"
  | "DATABASE_NOT_CONFIGURED"
  | "CONFIGURATION_ERROR"
  | "TIMEOUT"
  | "INTERNAL_ERROR";

const DEFAULT_STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  AI_NOT_CONFIGURED: 503,
  AI_UPSTREAM_ERROR: 502,
  DATABASE_NOT_CONFIGURED: 503,
  CONFIGURATION_ERROR: 500,
  TIMEOUT: 504,
  INTERNAL_ERROR: 500,
};

export interface AppErrorInit {
  code: ErrorCode;
  message: string;
  status?: number;
  /** Whether the message is safe to return to the caller. */
  expose?: boolean;
  details?: unknown;
  cause?: unknown;
}

/** A single, typed error shape used across routes, providers and UI boundaries. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly expose: boolean;
  readonly details: unknown;

  constructor(init: AppErrorInit) {
    super(init.message, init.cause !== undefined ? { cause: init.cause } : undefined);
    this.name = "AppError";
    this.code = init.code;
    this.status = init.status ?? DEFAULT_STATUS[init.code];
    this.expose = init.expose ?? false;
    this.details = init.details;
  }

  /** Client-safe representation. Non-exposed messages never leak internals. */
  toSafeJSON(): { code: ErrorCode; message: string; details?: unknown } {
    const base = {
      code: this.code,
      message: this.expose ? this.message : "Internal server error.",
    };
    return this.expose && this.details !== undefined
      ? { ...base, details: this.details }
      : base;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Normalise anything thrown into an `AppError` so responses stay predictable. */
export function toAppError(cause: unknown): AppError {
  if (isAppError(cause)) return cause;

  if (cause instanceof ZodError) {
    return new AppError({
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      expose: true,
      details: cause.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
      cause,
    });
  }

  if (
    cause instanceof Error &&
    (cause.name === "AbortError" || cause.name === "TimeoutError")
  ) {
    return new AppError({
      code: "TIMEOUT",
      message: "The request timed out or was cancelled.",
      expose: true,
      cause,
    });
  }

  return new AppError({
    code: "INTERNAL_ERROR",
    message: "Internal server error.",
    expose: false,
    cause,
  });
}
