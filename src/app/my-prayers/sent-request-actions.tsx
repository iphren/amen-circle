"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useTranslations } from "@/components/i18n-provider";

export function SentRequestActions({
  id,
  answered,
}: {
  id: string;
  answered: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setAnswered(value: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/my/requests/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answered: value }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.myPrayers.couldNotUpdate);
      }
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t.myPrayers.couldNotUpdate,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: t.myPrayers.deleteConfirmTitle,
      description: t.myPrayers.deleteConfirmDescription,
      confirmText: t.myPrayers.deleteConfirmText,
      destructive: true,
    });
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/my/requests/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.myPrayers.couldNotDelete);
      }
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t.myPrayers.couldNotDelete,
      );
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {answered ? (
          <>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {t.myPrayers.prayerAnswered}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setAnswered(false)}
            >
              {t.myPrayers.undo}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setAnswered(true)}
          >
            {t.myPrayers.prayerAnswered}
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="ml-auto"
          disabled={busy}
          onClick={handleDelete}
        >
          {t.myPrayers.delete}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {dialog}
    </div>
  );
}
