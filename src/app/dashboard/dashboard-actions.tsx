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

export function DashboardActions() {
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
        throw new Error(j.error ?? "could not create room");
      }
      const room = await res.json();
      router.push(`/rooms/${room.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
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
        throw new Error(j.error ?? "could not join");
      }
      const { roomId } = await res.json();
      router.push(`/rooms/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Start or join a room</CardTitle>
        <CardDescription>
          Enter a 6-character code to join someone&apos;s circle, or type a name
          to start your own.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Label htmlFor="roomInput" className="sr-only">
          Room code or name
        </Label>
        <Input
          id="roomInput"
          placeholder="Room code (e.g. ABC234) or a name…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          name="amen-circle-room-input"
        />
        <p className="text-xs text-muted-foreground">
          {looksLikeCode
            ? "Looks like a room code — you'll join that room."
            : trimmed
              ? "Not a code — you'll create a new room with this name."
              : "Type a code to join, or a name to create."}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            onClick={joinRoom}
            disabled={busy !== null || !looksLikeCode}
            variant={looksLikeCode ? "default" : "outline"}
          >
            {busy === "join" ? "Joining…" : "Join room"}
          </Button>
          <Button
            onClick={createRoom}
            disabled={busy !== null || !canCreate}
            variant={canCreate ? "default" : "outline"}
          >
            {busy === "create" ? "Creating…" : "Create room"}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
