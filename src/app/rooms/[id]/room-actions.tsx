"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm, type ConfirmOptions } from "@/components/ui/confirm-dialog";
import { useTranslations } from "@/components/i18n-provider";

interface Props {
  roomId: string;
  isOwner: boolean;
  isOpen: boolean;
}

export function RoomActions({ roomId, isOwner, isOpen }: Props) {
  const t = useTranslations();
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
        throw new Error(j.error ?? t.room.somethingWentWrong);
      }
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.failed);
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
              title: t.room.cancelConfirmTitle,
              description: t.room.cancelConfirmDescription,
              confirmText: t.room.cancelRoom,
              cancelText: t.room.cancelKeepText,
              destructive: true,
            })
          }
        >
          {busy ? t.room.cancelling : t.room.cancelRoom}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            run(`/api/rooms/${roomId}/leave`, "POST", {
              title: t.room.leaveConfirmTitle,
              description: t.room.leaveConfirmDescription,
              confirmText: t.room.leaveRoom,
              cancelText: t.room.leaveStayText,
              destructive: true,
            })
          }
        >
          {busy ? t.room.leaving : t.room.leaveRoom}
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
