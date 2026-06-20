import fs from "node:fs";
import path from "node:path";

// Amplify WEB_COMPUTE doesn't reliably inject env vars into the SSR Lambda
// runtime. During the Amplify build (where they ARE available), amplify.yml
// writes them to .next/server/runtime-env.json. This file is part of the
// .next artifact, lives server-side only, and is never served over HTTP.
//
// Next.js calls register() once when the server initializes — before any
// route handler module is imported — so the values land in process.env in
// time for our top-level env reads in session.ts, webauthn.ts, etc.
export async function register() {
  if (process.env.NODE_ENV !== "production") return;
  // register() runs in both the edge and node runtimes; the env snapshot and
  // Prisma only apply to the node SSR Lambda.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const configPath = path.join(
      process.env.LAMBDA_TASK_ROOT ?? process.cwd(),
      ".next/server/runtime-env.json",
    );
    const raw = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw) as Record<string, string | undefined>;
    for (const [key, value] of Object.entries(config)) {
      if (value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // File absent in non-Amplify environments (local dev, Vercel, etc.) —
    // those platforms inject env vars natively.
  }

  // Warm the DB connection during Lambda init so the Neon wake + connection
  // cost is paid here (register() is awaited before requests are handled)
  // rather than inline on the first user request. The dynamic import runs
  // after the env snapshot above so DATABASE_URL is populated before Prisma
  // reads it. A still-suspended Neon instance can take a moment to wake, so we
  // retry with backoff; a final failure is swallowed — requests will still
  // connect lazily, and warm-up must never crash server init.
  try {
    const { prisma } = await import("@/lib/prisma");
    const backoffsMs = [250, 500, 1000];
    for (let attempt = 0; ; attempt++) {
      try {
        await prisma.$connect();
        break;
      } catch (err) {
        if (attempt >= backoffsMs.length) throw err;
        await new Promise((resolve) =>
          setTimeout(resolve, backoffsMs[attempt]),
        );
      }
    }
  } catch {
    // Warm-up failed after retries — fall through; lazy connect on first query.
  }
}
