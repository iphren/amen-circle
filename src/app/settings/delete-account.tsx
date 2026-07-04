"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";

export function DeleteAccount() {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete your account?",
      description:
        "This permanently deletes your account, your prayer requests, and any circles you own (for all their members). This cannot be undone.",
      confirmText: "Delete everything",
      destructive: true,
    });
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/my/account", { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "could not delete your account");
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "could not delete your account",
      );
      setBusy(false);
    }
  }

  return (
    <Card className="border-destructive/40">
      <Collapsible.Root defaultOpen={false}>
        <CardHeader>
          <Collapsible.Trigger className="group flex w-full items-center justify-between gap-2 text-left">
            <div>
              <CardTitle className="text-base">Danger zone</CardTitle>
              <CardDescription>
                Deleting your account removes your prayer requests and any
                circles you own, for all their members. Consider{" "}
                <a
                  href="/api/my/export"
                  className="underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  downloading your data
                </a>{" "}
                first.
              </CardDescription>
            </div>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-180" />
          </Collapsible.Trigger>
        </CardHeader>
        <Collapsible.Panel className="overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 h-[var(--collapsible-panel-height)]">
          <CardContent className="flex flex-col pt-8 gap-3">
            <Button
              variant="destructive"
              className="self-start"
              disabled={busy}
              onClick={handleDelete}
            >
              {busy ? "Deleting…" : "Delete account"}
            </Button>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {dialog}
          </CardContent>
        </Collapsible.Panel>
      </Collapsible.Root>
    </Card>
  );
}
