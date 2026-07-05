import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Guards a post-auth redirect target against open redirects: only same-origin
// absolute paths are allowed, so a crafted `?next=//evil.com` or
// `?next=https://evil.com` falls back to a safe internal path.
export function safeInternalPath(next?: string, fallback = "/dashboard") {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}

// Locale-deterministic so server and client render the same string (no
// hydration drift): the caller passes the active locale. Renders e.g.
// "3 July 2026" (en-GB) or "2026年7月3日" (zh-CN).
export function formatDate(date: Date | string, locale = "en-GB") {
  return new Date(date).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const NAME_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
]

// Deterministic per name so a person keeps the same chip color across renders.
export function nameColorClasses(name: string): string {
  let sum = 0
  for (const ch of name) sum += ch.codePointAt(0)!
  return NAME_COLORS[sum % NAME_COLORS.length]
}
