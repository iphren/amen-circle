"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useTranslations } from "@/components/i18n-provider";

// Purple styling for the "close & assign" action, so it reads as distinct from
// the red destructive "cancel room" button. Shared by the card button and the
// confirmation dialog's confirm button so the two never drift.
const closeButtonClass =
  "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 focus-visible:border-violet-500/40 focus-visible:ring-violet-500/20 dark:bg-violet-500/20 dark:text-violet-400 dark:hover:bg-violet-500/30 dark:focus-visible:ring-violet-500/40";

interface Props {
  roomId: string;
  isOwner: boolean;
  isOpen: boolean;
  existingContent: string | null;
  existingIsConfidential: boolean;
  hasExisting: boolean;
  requestsCount: number;
  membersCount: number;
}

export function RoomClient({
  roomId,
  isOwner,
  isOpen,
  existingContent,
  existingIsConfidential,
  hasExisting,
  requestsCount,
  membersCount,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [content, setContent] = useState(existingContent ?? "");
  const [isConfidential, setIsConfidential] = useState(existingIsConfidential);
  const [busy, setBusy] = useState<"submit" | "close" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Poor-man's real-time: while the room is OPEN, poll every 5s for member
  // joins or owner-initiated close. Pauses when the tab is hidden.
  useEffect(() => {
    if (!isOpen) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      timer = setInterval(() => router.refresh(), 5000);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isOpen, router]);

  async function submit() {
    setBusy("submit");
    setError(null);
    setOkMsg(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/requests`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, isConfidential }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.room.couldNotSubmit);
      }
      setOkMsg(hasExisting ? t.room.updated : t.room.submittedMsg);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.failed);
    } finally {
      setBusy(null);
    }
  }

  async function closeRoom() {
    const ok = await confirm({
      title: t.room.closeConfirmTitle,
      description: t.room.closeConfirmDescription,
      confirmText: t.room.closeConfirmText,
      cancelText: t.room.closeCancelText,
      confirmClassName: closeButtonClass,
    });
    if (!ok) return;
    setBusy("close");
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/close`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.room.couldNotCloseRoom);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.failed);
    } finally {
      setBusy(null);
    }
  }

  if (!isOpen) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.room.closedTitle}</CardTitle>
          <CardDescription>{t.room.closedDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/my-prayers" className={buttonVariants()}>
            {t.room.goToMyPrayers}
          </a>
        </CardContent>
      </Card>
    );
  }

  const canSubmit = content.trim().length > 0 && busy === null;
  const canClose =
    isOwner && requestsCount > 0 && membersCount >= 2 && busy === null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.room.yourRequestTitle}</CardTitle>
          <CardDescription>
            {hasExisting
              ? t.room.yourRequestUpdateDescription
              : t.room.yourRequestNewDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="content" className="sr-only">
              {t.room.requestLabel}
            </Label>
            <Textarea
              id="content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                existingIsConfidential && hasExisting
                  ? t.room.confidentialRequestPlaceholder
                  : t.room.requestPlaceholder
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="confidential" className="text-sm">
                {t.room.confidentialLabel}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t.room.confidentialHint}
              </p>
            </div>
            <Switch
              id="confidential"
              checked={isConfidential}
              onCheckedChange={setIsConfidential}
            />
          </div>
          <Button onClick={submit} disabled={!canSubmit}>
            {busy === "submit"
              ? t.room.saving
              : hasExisting
                ? t.room.updateRequest
                : t.room.submitRequest}
          </Button>
          {okMsg && <p className="text-sm text-emerald-700">{okMsg}</p>}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.room.closeTitle}</CardTitle>
            <CardDescription>{t.room.closeDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button
              onClick={closeRoom}
              disabled={!canClose}
              className={closeButtonClass}
            >
              {busy === "close" ? t.room.closing : t.room.closeAction}
            </Button>
            {membersCount < 2 && (
              <p className="text-xs text-muted-foreground">
                {t.room.needTwoMembers}
              </p>
            )}
            {requestsCount === 0 && (
              <p className="text-xs text-muted-foreground">
                {t.room.noRequestsYet}
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {dialog}
    </div>
  );
}
