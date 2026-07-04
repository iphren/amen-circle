import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { LOCALE_COOKIE, isSupportedLocale } from "@/lib/i18n/config";

interface LanguageBody {
  language?: string;
}

// One year; the choice also lives on the user record, so the cookie is just a
// fast path that avoids a header re-negotiation on the next request.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function POST(req: Request) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => ({}))) as LanguageBody;
  if (!isSupportedLocale(body.language)) {
    return NextResponse.json(
      { error: "unsupported language" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: auth.userId },
    data: { preferredLanguage: body.language },
  });

  const res = NextResponse.json({ ok: true });
  // Keep the cookie in sync so the change takes effect immediately, including
  // for any request that resolves the locale before re-reading the user.
  res.cookies.set(LOCALE_COOKIE, body.language, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return res;
}
