"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/components/i18n-provider";
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/config";

export function LanguageCard({ current }: { current: Locale }) {
  const t = useTranslations();
  const router = useRouter();
  const [value, setValue] = useState<Locale>(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reconcile the dropdown when router.refresh() re-renders the server with a new
  // locale (e.g. changed from the footer selector). useState seeds `value` only once,
  // so we adjust it during render — not in an effect — whenever the authoritative
  // `current` prop changes, per React's documented pattern.
  const [lastCurrent, setLastCurrent] = useState<Locale>(current);
  if (current !== lastCurrent) {
    setLastCurrent(current);
    setValue(current);
  }

  async function handleChange(next: Locale) {
    const previous = value;
    setValue(next);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/my/language", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.settings.couldNotSaveLanguage);
      }
      // Re-render server components with the new locale.
      router.refresh();
    } catch (e) {
      setValue(previous);
      setError(e instanceof Error ? e.message : t.settings.couldNotSaveLanguage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.settings.languageTitle}</CardTitle>
        <CardDescription>{t.settings.languageDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Label htmlFor="language" className="text-sm">
          {t.settings.languageLabel}
        </Label>
        <select
          id="language"
          className="w-full max-w-xs rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
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
        {busy && (
          <p className="text-xs text-muted-foreground">
            {t.settings.languageSaving}
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
