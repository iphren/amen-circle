import type { Locale } from "@/lib/i18n/config";
import { enGB, type Dictionary } from "@/lib/i18n/dictionaries/en-GB";
import { zhCN } from "@/lib/i18n/dictionaries/zh-CN";

const overrides: Record<Exclude<Locale, "en-GB">, unknown> = {
  "zh-CN": zhCN,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
}

// Deep-merge a locale's overrides over the en-GB base. A blank string, an empty
// array, or an omitted key falls back to English, so partial translations are
// always safe.
function merge<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;

  if (typeof base === "string") {
    return (typeof override === "string" && override.length > 0
      ? override
      : base) as T;
  }

  if (Array.isArray(base)) {
    return (Array.isArray(override) && override.length > 0
      ? override
      : base) as T;
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const out: Record<string, unknown> = { ...base };
    for (const key of Object.keys(base)) {
      out[key] = merge((base as Record<string, unknown>)[key], override[key]);
    }
    return out as T;
  }

  return (override ?? base) as T;
}

export function getDictionary(locale: Locale): Dictionary {
  if (locale === "en-GB") return enGB;
  return merge(enGB, overrides[locale]);
}
