import type { NextConfig } from "next";

// No third-party runtime origins exist (SES is server-side, fonts are
// self-hosted via next/font), so everything is locked to 'self'.
// 'unsafe-inline' is required by Next's inline bootstrap script and inlined
// styles; a nonce-based CSP would force full dynamic rendering for no real
// gain since no third-party scripts run. 'unsafe-eval' is dev-only (React
// Refresh needs it).
const csp = [
  "default-src 'self'",
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Emits .next/standalone for the production Docker image (see Dockerfile).
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "@prisma/engines"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
