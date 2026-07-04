// Locale configuration and the fallback engine shared by the server resolver,
// the proxy detector, and the settings API. No dependency on `next/*` so it can
// be imported from anywhere (server, client, proxy).

export const SUPPORTED_LOCALES = ["en-GB", "zh-CN"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en-GB";

export const LOCALE_COOKIE = "locale";

// Human-readable names for each locale, shown in the settings picker.
export const LOCALE_LABELS: Record<Locale, string> = {
  "en-GB": "English (UK)",
  "zh-CN": "简体中文",
};

export function isSupportedLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

// Normalise any language tag to a supported locale using the agreed rules:
// any `zh*` -> zh-CN, any `en*` -> en-GB, everything else -> the default.
export function resolveLocale(input: string | null | undefined): Locale {
  if (!input) return DEFAULT_LOCALE;
  const tag = input.trim().toLowerCase();
  if (tag.startsWith("zh")) return "zh-CN";
  if (tag.startsWith("en")) return "en-GB";
  return DEFAULT_LOCALE;
}

// Parse an `Accept-Language` header and return the highest-quality tag that
// resolves to a non-default supported locale; otherwise fall back to default.
// A minimal hand-rolled parser so we avoid the `negotiator` dependency.
export function negotiateAcceptLanguage(
  header: string | null | undefined,
): Locale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));
      const quality = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag: tag.trim(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .filter((entry) => entry.tag && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    if (tag === "*") continue;
    const resolved = resolveLocale(tag);
    // Only accept a header tag that actually matches a language we translate;
    // resolveLocale maps unknown tags to the default, which we don't want to
    // treat as a positive match here.
    if (tag.toLowerCase().startsWith("zh") || tag.toLowerCase().startsWith("en")) {
      return resolved;
    }
  }

  return DEFAULT_LOCALE;
}
