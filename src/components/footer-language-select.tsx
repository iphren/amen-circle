"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/components/i18n-provider";
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/config";

export function FooterLanguageSelect({ current }: { current: Locale }) {
  const t = useTranslations();
  const router = useRouter();
  const [value, setValue] = useState<Locale>(current);
  const [busy, setBusy] = useState(false);

  async function handleChange(next: Locale) {
    const previous = value;
    setValue(next);
    setBusy(true);
    try {
      const res = await fetch("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      if (!res.ok) throw new Error();
      // Re-render server components with the new locale.
      router.refresh();
    } catch {
      setValue(previous);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      aria-label={t.footer.languageLabel}
      className="rounded-md border bg-transparent px-2 py-1 text-xs text-muted-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
      value={value}
      disabled={busy}
      onChange={(e) => handleChange(e.target.value as Locale)}
    >
      {SUPPORTED_LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_LABELS[locale]}
        </option>
      ))}
    </select>
  );
}
