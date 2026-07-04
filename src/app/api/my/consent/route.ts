import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

interface ConsentBody {
  acceptTerms?: boolean;
  consentReligiousData?: boolean;
}

// Backfill consent for accounts created before the consent flow existed.
// New accounts record these timestamps at registration instead.
export async function POST(req: Request) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const t = getDictionary(await resolveRequestLocale());

  const body = (await req.json()) as ConsentBody;
  if (body.acceptTerms !== true || body.consentReligiousData !== true) {
    return NextResponse.json(
      { error: t.errors.mustAcceptTerms },
      { status: 400 },
    );
  }

  const now = new Date();
  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      termsAcceptedAt: now,
      religiousDataConsentAt: now,
      ageConfirmedAt: now,
    },
  });

  return NextResponse.json({ ok: true });
}
