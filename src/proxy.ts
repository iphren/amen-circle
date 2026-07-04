import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  negotiateAcceptLanguage,
} from "@/lib/i18n/config";

// Next.js 16 renamed Middleware to Proxy. This runs before every matched
// request and, for visitors without a locale cookie yet, detects a locale from
// the Accept-Language header and persists it. Logged-in users' saved preference
// still takes precedence when the locale is resolved server-side
// (see src/lib/i18n/get-locale.ts) — this only seeds first-time / logged-out
// visitors so they get a stable choice. No redirects: locale is cookie-based,
// so URLs are never rewritten.
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.has(LOCALE_COOKIE)) {
    const locale = negotiateAcceptLanguage(
      request.headers.get("accept-language"),
    );
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  // Run on pages only: skip Next internals, API routes, and static assets.
  matcher: ["/((?!_next|api|.*\\.[\\w]+$).*)"],
};
