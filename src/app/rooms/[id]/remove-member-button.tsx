"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";

export function RemoveMemberButton({
  roomId,
  userId,
  displayName,
}: {
  roomId: string;
  userId: string;
  displayName: string;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [busy, setBusy] = useState(false);

  async function handleRemove() {
    const ok = await confirm({
      title: `Remove ${displayName}?`,
      description:
        "They will be removed from this circle and the request they shared here will be deleted.",
      confirmText: "Remove",
      destructive: true,
    });
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(
        `/api/rooms/${roomId}/members/${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "could not remove member");
      }
      router.refresh();
    } catch (e) {
      // Surface via alert — this sits in a dense list with no room for
      // per-row error text.
      window.alert(
        e instanceof Error ? e.message : "could not remove member",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-destructive hover:text-destructive"
        disabled={busy}
        onClick={handleRemove}
      >
        {busy ? "…" : "Remove"}
      </Button>
      {dialog}
    </>
  );
}
