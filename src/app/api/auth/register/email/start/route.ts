import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findOrCreateSignupUser } from "@/lib/signup";
import {
  LOGIN_LINK_TTL_MS,
  TOKEN_EMAIL_WINDOW_MS,
  generateRecoveryToken,
  isTokenEmailRateLimited,
} from "@/lib/recovery-token";
import { sendLoginLinkEmail, sendRegistrationLinkEmail } from "@/lib/email";
import { origin } from "@/lib/webauthn";
import { resolveLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

interface RegisterEmailStartBody {
  email?: string;
  displayName?: string;
  acceptTerms?: boolean;
  consentReligiousData?: boolean;
}

// Passkey-free registration: emails a single-use link that signs the user in
// (see /api/auth/login/email/verify), which also marks the email verified and
// thereby completes the account. Grants no session itself.
export async function POST(req: Request) {
  const requestLocale = await resolveRequestLocale();
  const t = getDictionary(requestLocale);
  const body = (await req.json()) as RegisterEmailStartBody;
  const email = body.email?.trim().toLowerCase();
  const displayName = body.displayName?.trim();

  // Input validation may 400: these concern only the requester's own
  // submission and are decided before any account lookup, so they reveal
  // nothing. Everything after must return the identical generic response.
  if (!email || !displayName) {
    return NextResponse.json(
      { error: t.errors.emailAndDisplayNameRequired },
      { status: 400 },
    );
  }

  // Enforced server-side, not just in the UI: registration is the point where
  // we record the demonstrable consent UK GDPR requires. acceptTerms covers
  // terms + 18+ age confirmation; consentReligiousData is the unbundled
  // Art. 9(2)(a) explicit consent for prayer content.
  if (body.acceptTerms !== true || body.consentReligiousData !== true) {
    return NextResponse.json(
      { error: t.errors.mustAcceptTermsToRegister },
      { status: 400 },
    );
  }

  const genericOk = NextResponse.json({ ok: true });

  const result = await findOrCreateSignupUser(email, displayName);
  // Unrecoverable create race: stay uniform rather than surfacing a 500.
  if (!result) return genericOk;
  const user = result.user;

  // Silent rate limit so this endpoint can't be used to bomb someone's inbox.
  // Counts the same LoginToken rows as login/email/start, so alternating
  // endpoints can't double the budget.
  const recentTokens = await prisma.loginToken.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: new Date(Date.now() - TOKEN_EMAIL_WINDOW_MS) },
    },
    select: { createdAt: true },
  });
  if (isTokenEmailRateLimited(recentTokens.map((tok) => tok.createdAt))) {
    return genericOk;
  }

  // Invalidate any outstanding sign-in tokens for this user, then mint a fresh
  // single-use one.
  const { raw, hash } = generateRecoveryToken();
  await prisma.$transaction([
    prisma.loginToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.loginToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + LOGIN_LINK_TTL_MS),
      },
    }),
  ]);

  const linkUrl = `${origin}/auth/email-login?token=${encodeURIComponent(raw)}`;
  try {
    if (result.status === "complete") {
      // The address already belongs to a real account. Quietly send a sign-in
      // link instead of a registration one — the legitimate owner still ends
      // up signed in, and the response stays indistinguishable.
      await sendLoginLinkEmail({
        to: user.email,
        loginUrl: linkUrl,
        locale: resolveLocale(user.preferredLanguage),
      });
    } else {
      // A brand-new signup has no stored preferredLanguage; use the locale
      // the person is registering in.
      await sendRegistrationLinkEmail({
        to: user.email,
        activateUrl: linkUrl,
        locale: requestLocale,
      });
    }
  } catch (err) {
    // Don't surface send failures to the caller (would leak account existence
    // and isn't actionable for them). Log for operators.
    console.error("registration link email send failed", err);
  }

  return genericOk;
}
