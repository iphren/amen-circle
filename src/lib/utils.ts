import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Locale-deterministic so server and client render the same string (no
// hydration drift). Renders e.g. "3 July 2026".
export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const NAME_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
]

// Deterministic per name so a person keeps the same chip color across renders.
export function nameColorClasses(name: string): string {
  let sum = 0
  for (const ch of name) sum += ch.codePointAt(0)!
  return NAME_COLORS[sum % NAME_COLORS.length]
}
