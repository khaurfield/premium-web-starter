/**
 * Isomorphic structured logger. It deliberately has no `server-only` import so
 * client-side error boundaries can use it. It emits one JSON object per line,
 * which is directly consumable by Vercel / GitHub Actions log viewers.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEY =
  /(api[_-]?key|token|secret|password|passwd|authorization|cookie|set-cookie|service[_-]?role|credential|private[_-]?key)/i;

const SENSITIVE_VALUE =
  /(?:sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._-]{12,}|eyJ[A-Za-z0-9_-]{20,})/;

const MAX_DEPTH = 4;

/** Deep-clone a log context while removing anything that looks like a secret. */
export function redact(
  value: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet<object>(),
): unknown {
  if (typeof value === "string") {
    return SENSITIVE_VALUE.test(value) ? "[REDACTED]" : value;
  }
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  if (depth >= MAX_DEPTH) return "[Truncated]";

  seen.add(value);

  if (value instanceof Error) {
    return { name: value.name, message: redact(value.message) };
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1, seen));
  }

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    output[key] = SENSITIVE_KEY.test(key)
      ? "[REDACTED]"
      : redact(nested, depth + 1, seen);
  }
  return output;
}

export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const record: Record<string, unknown> = {
      name: error.name,
      message: error.message,
    };
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") record.code = code;
    return record;
  }
  return { message: String(error) };
}

function defaultSink(record: LogRecord): void {
  const line = JSON.stringify(record);
  switch (record.level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.log(line);
  }
}

function resolveDefaultLevel(): LogLevel {
  const raw = typeof process !== "undefined" ? process.env.LOG_LEVEL : undefined;
  return raw === "debug" || raw === "info" || raw === "warn" || raw === "error"
    ? raw
    : "info";
}

export interface LoggerOptions {
  level?: LogLevel;
  requestId?: string;
  component?: string;
  context?: LogContext;
  /** Injectable for tests; defaults to stdout/stderr as JSON lines. */
  sink?: (record: LogRecord) => void;
}

export interface Logger {
  readonly level: LogLevel;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(context: LogContext): Logger;
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const level = options.level ?? resolveDefaultLevel();
  const sink = options.sink ?? defaultSink;
  const base: LogContext = {
    ...(options.component ? { component: options.component } : {}),
    ...(options.requestId ? { requestId: options.requestId } : {}),
    ...(options.context ?? {}),
  };

  const write = (
    currentLevel: LogLevel,
    message: string,
    context?: LogContext,
  ): void => {
    if (LEVEL_ORDER[currentLevel] < LEVEL_ORDER[level]) return;
    const payload = redact({ ...base, ...(context ?? {}) }) as LogContext;
    sink({
      timestamp: new Date().toISOString(),
      level: currentLevel,
      message,
      ...payload,
    });
  };

  return {
    level,
    debug: (message, context) => write("debug", message, context),
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context),
    child: (context) =>
      createLogger({
        ...options,
        level,
        context: { ...base, ...context },
      }),
  };
}

export function getLogger(component: string): Logger {
  return createLogger({ component });
}
