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
