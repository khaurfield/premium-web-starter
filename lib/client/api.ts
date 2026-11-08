import {
  apiErrorEnvelopeSchema,
  modelCatalogSchema,
  type ModelCatalog,
} from "@/lib/api/contracts";
import type { ApiErrorInfo } from "@/lib/client/types";

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;

  constructor(info: ApiErrorInfo) {
    super(info.message);
    this.name = "ApiRequestError";
    this.code = info.code;
    this.status = info.status ?? 0;
    this.requestId = info.requestId;
  }
}

export function toErrorInfo(cause: unknown): ApiErrorInfo {
  if (cause instanceof ApiRequestError) {
    return {
      code: cause.code,
      message: cause.message,
      status: cause.status,
      requestId: cause.requestId,
    };
  }
  if (cause instanceof Error && cause.name === "AbortError") {
    return { code: "ABORTED", message: "Request cancelled." };
  }
  return {
    code: "NETWORK_ERROR",
    message:
      cause instanceof Error && cause.message
        ? cause.message
        : "Could not reach the server. Check your connection and try again.",
  };
}

async function parseFailure(response: Response): Promise<ApiRequestError> {
  let code = `HTTP_${response.status}`;
  let message = `The server returned HTTP ${response.status}.`;
  let requestId: string | undefined;
  try {
    const payload: unknown = await response.json();
    const parsed = apiErrorEnvelopeSchema.safeParse(payload);
    if (parsed.success) {
      code = parsed.data.error.code;
      message = parsed.data.error.message;
      requestId = parsed.data.requestId;
    }
  } catch {
    // A non-JSON failure still produces a usable, typed error.
  }
  return new ApiRequestError({
    code,
    message,
    status: response.status,
    requestId: response.headers.get("x-request-id") ?? requestId ?? undefined,
  });
}

export async function fetchModelCatalog(signal?: AbortSignal): Promise<ModelCatalog> {
  const response = await fetch("/api/models", {
    method: "GET",
    cache: "no-store",
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw await parseFailure(response);

  const payload: unknown = await response.json();
  const envelope = payload as { data?: unknown };
  const parsed = modelCatalogSchema.safeParse(envelope.data);
  if (!parsed.success) {
    throw new ApiRequestError({
      code: "INVALID_RESPONSE",
      message: "The model catalog response was malformed.",
      status: response.status,
    });
  }
  return parsed.data;
}
