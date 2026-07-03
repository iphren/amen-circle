import { randomBytes } from "node:crypto";

// 32-char alphabet, no ambiguous chars (0/O/1/I/L removed)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 6): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

const CODE_RE = new RegExp(`^[${ALPHABET}]{6}$`);

// A 6-char string drawn entirely from the room-code alphabet (case- and
// whitespace-insensitive). Used to tell a join code apart from a room name.
export function isRoomCode(value: string): boolean {
  return CODE_RE.test(value.trim().toUpperCase());
}
