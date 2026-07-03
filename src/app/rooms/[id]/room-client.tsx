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
        throw new Error(j.error ?? "could not submit");
      }
      setOkMsg(hasExisting ? "Updated." : "Submitted.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(null);
    }
  }

  async function closeRoom() {
    const ok = await confirm({
      title: "Close room & assign?",
      description:
        "Requests will be shuffled and assigned now — this can't be undone.",
      confirmText: "Close & assign",
      cancelText: "Not yet",
      confirmClassName: closeButtonClass,
    });
    if (!ok) return;
    setBusy("close");
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/close`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "could not close room");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(null);
    }
  }

  if (!isOpen) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Room is closed</CardTitle>
          <CardDescription>
            Requests have been assigned. Head over to your prayers to see who
            you&apos;re lifting up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/my-prayers" className={buttonVariants()}>
            Go to my prayers
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
          <CardTitle className="text-base">Your prayer request</CardTitle>
          <CardDescription>
            {hasExisting
              ? "You can update this at any time before the room is closed."
              : "Share what's on your heart. You can update it later if needed."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="content" className="sr-only">
              Request
            </Label>
            <Textarea
              id="content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                existingIsConfidential && hasExisting
                  ? "(Your previous request is confidential and not shown here. Type to replace it.)"
                  : "Type your prayer request…"
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="confidential" className="text-sm">
                Confidential
              </Label>
              <p className="text-xs text-muted-foreground">
                Encrypts your request so the assignee must tap to reveal it.
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
              ? "Saving…"
              : hasExisting
                ? "Update request"
                : "Submit request"}
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
            <CardTitle className="text-base">Close room & assign</CardTitle>
            <CardDescription>
              When everyone&apos;s ready, shuffle the requests and assign each
              one to someone other than its author.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button
              onClick={closeRoom}
              disabled={!canClose}
              className={closeButtonClass}
            >
              {busy === "close" ? "Closing…" : "Close room & assign"}
            </Button>
            {membersCount < 2 && (
              <p className="text-xs text-muted-foreground">
                Need at least 2 members to assign.
              </p>
            )}
            {requestsCount === 0 && (
              <p className="text-xs text-muted-foreground">
                No requests submitted yet.
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {dialog}
    </div>
  );
}
