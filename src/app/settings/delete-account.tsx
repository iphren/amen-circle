"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      <CardHeader>
        <CardTitle className="text-base">Danger zone</CardTitle>
        <CardDescription>
          Deleting your account removes your prayer requests and any circles
          you own, for all their members. Consider{" "}
          <a href="/api/my/export" className="underline">
            downloading your data
          </a>{" "}
          first.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
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
    </Card>
  );
}
