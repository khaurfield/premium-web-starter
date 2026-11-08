import type { NextConfig } from "next";

/**
 * Framework-level security headers. These apply to every route regardless of
 * the hosting provider. A Content-Security-Policy is intentionally NOT set yet:
 * Next.js injects inline bootstrap scripts, so a CSP must be introduced with
 * nonces and verified against real pages in a later stage.
 */
const securityHeaders: { key: string; value: string }[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // `microphone=(self)` is required for the browser's Web Speech dictation
    // control on /chat. Camera and geolocation stay disabled.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
