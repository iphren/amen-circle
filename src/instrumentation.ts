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
}
