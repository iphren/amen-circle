// One-shot migration: bring every PrayerRequest.content row onto the
// versioned "v1:" encrypted format (see src/lib/crypto.ts).
//
// Legacy rows come in two shapes, distinguished by isConfidential (the only
// reliable signal pre-versioning):
//   - confidential rows: already AES-256-GCM ciphertext, just missing the
//     "v1:" prefix — prepend it (same payload format);
//   - non-confidential rows: plaintext — encrypt them.
// Rows already starting with "v1:" are skipped, so the script is idempotent
// and safe to re-run.
//
// Usage (against the DB in DATABASE_URL):
//   npm run encrypt-requests
// (npm run already loads .env.local; for production, run with the prod
//  DATABASE_URL and ENCRYPTION_KEY in the environment instead.)

const {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} = require("node:crypto");
const { PrismaClient } = require("@prisma/client");

const PREFIX = "v1:";

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error("ENCRYPTION_KEY env var is required");
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  }
  return buf;
}

// Keep in sync with encrypt() in src/lib/crypto.ts:
// base64( iv(12) || authTag(16) || ciphertext )
function encrypt(plaintext) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

// Sanity check used on confidential rows before trusting they're ciphertext.
function decrypts(payload) {
  try {
    const buf = Buffer.from(payload, "base64");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getKey(),
      buf.subarray(0, 12),
    );
    decipher.setAuthTag(buf.subarray(12, 28));
    Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  getKey(); // fail fast before touching the DB

  const prisma = new PrismaClient();
  try {
    const rows = await prisma.prayerRequest.findMany({
      where: { NOT: { content: { startsWith: PREFIX } } },
      select: { id: true, content: true, isConfidential: true },
    });

    let prefixed = 0;
    let encrypted = 0;
    for (const row of rows) {
      let next;
      if (row.isConfidential) {
        if (!decrypts(row.content)) {
          throw new Error(
            `Row ${row.id} is confidential but its content does not decrypt — wrong ENCRYPTION_KEY? Aborting without changes to this row.`,
          );
        }
        next = PREFIX + row.content;
        prefixed += 1;
      } else {
        next = PREFIX + encrypt(row.content);
        encrypted += 1;
      }
      await prisma.prayerRequest.update({
        where: { id: row.id },
        data: { content: next },
      });
    }

    console.log(
      `Done. ${encrypted} plaintext row(s) encrypted, ${prefixed} ciphertext row(s) prefixed, ${rows.length} total migrated.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
