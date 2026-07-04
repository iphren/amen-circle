import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error("ENCRYPTION_KEY env var is required");
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  }
  return buf;
}

// Stored layout: base64( iv(12) || authTag(16) || ciphertext )
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// Versioned wrappers for prayer-request content. All content is now encrypted
// at rest with a "v1:" prefix; the prefix exists because legacy rows can't be
// told apart otherwise — pre-versioning ciphertext (confidential rows) and
// plaintext (non-confidential rows) are both plausible base64. The legacy
// fallback below keeps old rows readable until (and as a safety net after)
// scripts/encrypt-plaintext-requests.js migrates them.
const CONTENT_VERSION_PREFIX = "v1:";

export function encryptContent(plaintext: string): string {
  return CONTENT_VERSION_PREFIX + encrypt(plaintext);
}

export function decryptContent(
  stored: string,
  isConfidential: boolean,
): string {
  if (stored.startsWith(CONTENT_VERSION_PREFIX)) {
    return decrypt(stored.slice(CONTENT_VERSION_PREFIX.length));
  }
  return isConfidential ? decrypt(stored) : stored;
}
