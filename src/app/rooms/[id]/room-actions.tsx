"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm, type ConfirmOptions } from "@/components/ui/confirm-dialog";

interface Props {
  roomId: string;
  isOwner: boolean;
  isOpen: boolean;
}

export function RoomActions({ roomId, isOwner, isOpen }: Props) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(url: string, method: string, prompt: ConfirmOptions) {
    if (!(await confirm(prompt))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { method });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "something went wrong");
      }
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
      setBusy(false);
    }
  }

  // Leaving or cancelling only makes sense while the room is still open.
  if (!isOpen) return null;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {isOwner ? (
        <Button
          variant="destructive"
          size="sm"
          disabled={busy}
          onClick={() =>
            run(`/api/rooms/${roomId}`, "DELETE", {
              title: "Cancel this room?",
              description:
                "It will be deleted for everyone, along with all requests. This can't be undone.",
              confirmText: "Cancel room",
              cancelText: "Keep room",
              destructive: true,
            })
          }
        >
          {busy ? "Cancelling…" : "Cancel room"}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            run(`/api/rooms/${roomId}/leave`, "POST", {
              title: "Leave this room?",
              description: "Your prayer request here will be removed.",
              confirmText: "Leave room",
              cancelText: "Stay",
              destructive: true,
            })
          }
        >
          {busy ? "Leaving…" : "Leave room"}
        </Button>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      {dialog}
    </div>
  );
}
