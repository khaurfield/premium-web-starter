import { isAIConfigured } from "@/lib/ai/config";
import { APP_VERSION } from "@/lib/app-info";
import { jsonOk, withApiRoute } from "@/lib/api/response";
import { isDatabaseConfigured } from "@/lib/db/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness + configuration probe. Optional integrations are reported, never
 * faked: an unconfigured AI provider is an honest `not_configured` state.
 * No secret values or environment dumps are returned.
 */
export const GET = withApiRoute(
  ({ requestId }) => {
    const aiConfigured = isAIConfigured();
    const databaseConfigured = isDatabaseConfigured();

    return jsonOk(
      {
        status: "ok" as const,
        version: APP_VERSION,
        requestId,
        timestamp: new Date().toISOString(),
        integrations: {
          ai: {
            state: aiConfigured ? "configured" : "not_configured",
            configured: aiConfigured,
          },
          database: {
            state: databaseConfigured ? "configured" : "not_configured",
            configured: databaseConfigured,
          },
        },
      },
      requestId,
    );
  },
  { route: "api.health" },
);
