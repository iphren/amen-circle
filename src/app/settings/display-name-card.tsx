"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "@/components/i18n-provider";

export function DisplayNameCard({ current }: { current: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState(current);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setError(null);
    setDraft(name);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setDraft(name);
  }

  async function handleSave() {
    const displayName = draft.trim();
    if (!displayName) {
      setError(t.settings.nameCannotBeEmpty);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/my/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.settings.couldNotSaveName);
      }
      const updated = await res.json();
      setName(updated.displayName);
      setEditing(false);
      // Re-render server components (nav, member lists) with the new name.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.settings.couldNotSaveName);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t.settings.displayNameTitle}
        </CardTitle>
        <CardDescription>{t.settings.displayNameDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {editing ? (
          <div className="flex items-center justify-between gap-4">
            <Input
              autoFocus
              value={draft}
              maxLength={60}
              disabled={busy}
              aria-label={t.settings.displayNameTitle}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") cancelEditing();
              }}
            />
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                disabled={busy || !draft.trim()}
                onClick={handleSave}
              >
                {t.settings.save}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={cancelEditing}
              >
                {t.settings.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="min-w-0 truncate text-sm font-medium">{name}</p>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={startEditing}
            >
              {t.settings.rename}
            </Button>
          </div>
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
