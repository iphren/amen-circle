"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useTranslations } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

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
        <Menu.Root>
          <Menu.Trigger
            aria-label={t.myPrayers.moreActions}
            disabled={busy}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "ml-auto",
            )}
          >
            <MoreHorizontal />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner sideOffset={4} align="end" className="z-50">
              <Menu.Popup className="min-w-36 rounded-lg border bg-background p-1 shadow-lg outline-none transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
                <Menu.Item
                  onClick={handleDelete}
                  className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive outline-none select-none data-[highlighted]:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                  {t.myPrayers.delete}
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
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
