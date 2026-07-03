// Local-dev helper: mint a "lost passkey" recovery link without sending email.
//
// The real flow (POST /api/auth/recover/start) emails the link via SES, which
// isn't configured in local dev — and only the token's SHA-256 hash is stored,
// so a link can never be recovered after the fact. This script mirrors that
// route's logic (invalidate outstanding tokens, mint a fresh single-use one)
// and prints the link straight to your terminal.
//
// Usage:
//   npm run recovery-link -- you@example.com
// (npm run already loads .env.local; see package.json)

const { createHash, randomBytes } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");

// Keep in sync with RECOVERY_TTL_MS in src/lib/recovery-token.ts.
const RECOVERY_TTL_MS = 20 * 60 * 1000;

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run recovery-link -- <email>");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      console.error(`No user found for ${email}`);
      process.exit(1);
    }

    const raw = randomBytes(32).toString("base64url");
    const hash = createHash("sha256").update(raw).digest("hex");

    await prisma.$transaction([
      prisma.recoveryToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.recoveryToken.create({
        data: {
          userId: user.id,
          tokenHash: hash,
          expiresAt: new Date(Date.now() + RECOVERY_TTL_MS),
        },
      }),
    ]);

    const origin = process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3000";
    console.log(`${origin}/auth/recover?token=${encodeURIComponent(raw)}`);
    console.log("(valid for 20 minutes, single use)");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
