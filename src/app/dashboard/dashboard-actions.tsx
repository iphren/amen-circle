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

export function DashboardActions() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createRoom() {
    setBusy("create");
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: roomName }),
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
        body: JSON.stringify({ code: joinCode }),
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
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create a room</CardTitle>
          <CardDescription>
            Start a new prayer circle and invite friends with the code.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Label htmlFor="roomName" className="sr-only">
            Room name
          </Label>
          <Input
            id="roomName"
            placeholder="e.g. Wednesday small group"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <Button
            onClick={createRoom}
            disabled={busy !== null || !roomName.trim()}
          >
            {busy === "create" ? "Creating…" : "Create room"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Join a room</CardTitle>
          <CardDescription>
            Enter the 6-character code shared by the room owner.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Label htmlFor="joinCode" className="sr-only">
            Room code
          </Label>
          <Input
            id="joinCode"
            placeholder="ABCDEF"
            className="font-mono uppercase tracking-widest"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            name="amen-circle-join-code"
          />
          <Button
            variant="outline"
            onClick={joinRoom}
            disabled={busy !== null || joinCode.trim().length !== 6}
          >
            {busy === "join" ? "Joining…" : "Join room"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <p className="sm:col-span-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
