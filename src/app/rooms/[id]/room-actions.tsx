"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  roomId: string;
  isOwner: boolean;
  isOpen: boolean;
}

export function RoomActions({ roomId, isOwner, isOpen }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Leaving or cancelling only makes sense while the room is still open.
  if (!isOpen) return null;

  async function run(url: string, method: string, confirmMsg: string) {
    if (!confirm(confirmMsg)) return;
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

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {isOwner ? (
        <Button
          variant="destructive"
          size="sm"
          disabled={busy}
          onClick={() =>
            run(
              `/api/rooms/${roomId}`,
              "DELETE",
              "Cancel this room? It will be deleted for everyone, along with all requests. This can't be undone.",
            )
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
            run(
              `/api/rooms/${roomId}/leave`,
              "POST",
              "Leave this room? Your prayer request here will be removed.",
            )
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
    </div>
  );
}
