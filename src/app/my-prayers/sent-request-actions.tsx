"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";

export function SentRequestActions({
  id,
  answered,
}: {
  id: string;
  answered: boolean;
}) {
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
        throw new Error(j.error ?? "could not update your request");
      }
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "could not update your request",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete this prayer request?",
      description:
        "This permanently removes it, including from the list of anyone praying for it. This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/my/requests/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "could not delete your request");
      }
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "could not delete your request",
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
              Prayer answered
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setAnswered(false)}
            >
              Undo
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setAnswered(true)}
          >
            Prayer answered
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="ml-auto"
          disabled={busy}
          onClick={handleDelete}
        >
          Delete
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
