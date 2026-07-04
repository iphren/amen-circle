import { createHash, randomBytes } from "node:crypto";

// Recovery links are valid for 20 minutes.
export const RECOVERY_TTL_MS = 20 * 60 * 1000;

// Email sign-in (magic) links are valid for 15 minutes.
export const LOGIN_LINK_TTL_MS = 15 * 60 * 1000;

/**
 * Generate a single-use recovery token. The caller emails `raw` (inside the
 * recovery link) and stores only `hash` — the raw token never touches the DB,
 * so a database leak can't be replayed into account access.
 */
export function generateRecoveryToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashRecoveryToken(raw) };
}

export function hashRecoveryToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// Per-account cap on token emails (sign-in and recovery links), counted from
// the token rows themselves (each row = one email sent). Enforced silently:
// a limited request still gets the generic {ok:true}, otherwise the limiter
// would become an account-enumeration oracle.
export const TOKEN_EMAIL_COOLDOWN_MS = 60 * 1000;
export const TOKEN_EMAIL_WINDOW_MS = 60 * 60 * 1000;
export const TOKEN_EMAIL_MAX_PER_WINDOW = 3;

/**
 * Decide whether another token email may be sent, given the creation times of
 * this user's tokens within the last TOKEN_EMAIL_WINDOW_MS.
 */
export function isTokenEmailRateLimited(
  recentCreatedAts: Date[],
  now: number = Date.now(),
): boolean {
  if (recentCreatedAts.length >= TOKEN_EMAIL_MAX_PER_WINDOW) return true;
  return recentCreatedAts.some(
    (createdAt) => now - createdAt.getTime() < TOKEN_EMAIL_COOLDOWN_MS,
  );
}
