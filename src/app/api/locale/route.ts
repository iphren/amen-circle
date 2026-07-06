import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LOCALE_COOKIE, isSupportedLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

interface LocaleBody {
  locale?: string;
}

// One year; matches /api/my/language's cookie lifetime.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// Public counterpart to /api/my/language: sets the locale cookie for anyone,
// signed in or not, so the footer's language switcher works on every page. If
// the caller happens to be signed in, also save the preference to their
// account so it syncs across devices, same as the settings page.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as LocaleBody;
  if (!isSupportedLocale(body.locale)) {
    const t = getDictionary(await resolveRequestLocale());
    return NextResponse.json(
      { error: t.errors.unsupportedLanguage },
      { status: 400 },
    );
  }

  const session = await getSession();
  if (session.userId) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { preferredLanguage: body.locale },
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(LOCALE_COOKIE, body.locale, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return res;
}
