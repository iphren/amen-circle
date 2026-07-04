"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isRoomCode } from "@/lib/room-code";
import { useTranslations } from "@/components/i18n-provider";

export function DashboardActions() {
  const t = useTranslations();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmed = value.trim();
  const looksLikeCode = isRoomCode(value);
  const canCreate = trimmed.length > 0 && !looksLikeCode;

  async function createRoom() {
    setBusy("create");
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: value }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.dashboard.couldNotCreateRoom);
      }
      const room = await res.json();
      router.push(`/rooms/${room.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.failed);
    } finally {
      setBusy(null);
    }
  }

  async function joinRoom() {
    setBusy("join");
    setError(null);
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: trimmed.toUpperCase() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.dashboard.couldNotJoin);
      }
      const { roomId } = await res.json();
      router.push(`/rooms/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.failed);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t.dashboard.startOrJoinTitle}
        </CardTitle>
        <CardDescription>
          {t.dashboard.startOrJoinDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Label htmlFor="roomInput" className="sr-only">
            {t.dashboard.roomInputLabel}
          </Label>
          <Input
            id="roomInput"
            className="sm:flex-1"
            placeholder={t.dashboard.roomInputPlaceholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            name="amen-circle-room-input"
          />
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <Button
              onClick={joinRoom}
              disabled={busy !== null || !looksLikeCode}
              variant={looksLikeCode ? "default" : "outline"}
            >
              {busy === "join" ? t.dashboard.joining : t.dashboard.joinRoom}
            </Button>
            <Button
              onClick={createRoom}
              disabled={busy !== null || !canCreate}
              variant={canCreate ? "default" : "outline"}
              className={
                canCreate ? "bg-green-600 text-white hover:bg-green-700" : undefined
              }
            >
              {busy === "create" ? t.dashboard.creating : t.dashboard.createRoom}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {looksLikeCode
            ? t.dashboard.hintLooksLikeCode
            : trimmed
              ? t.dashboard.hintNotACode
              : t.dashboard.hintEmpty}
        </p>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
