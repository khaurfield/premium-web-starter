import { jsonOk, withApiRoute } from "@/lib/api/response";
import { getModelCatalog } from "@/lib/ai/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Browser-safe model catalog. Only ids, labels and the *names* of missing
 * variables are returned — never credentials or environment values.
 * The UI uses this to render a real model selector that changes the model used
 * by POST /api/chat.
 */
export const GET = withApiRoute(
  ({ requestId }) => jsonOk(getModelCatalog(), requestId),
  { route: "api.models" },
);
