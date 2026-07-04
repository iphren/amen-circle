"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "@/components/i18n-provider";

export function JoinCard({
  code,
  signedIn,
}: {
  code: string;
  signedIn: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function joinRoom() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.join.couldNotJoin);
      }
      const { roomId } = await res.json();
      router.push(`/rooms/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.failed);
      setBusy(false);
    }
  }

  const next = `/join?code=${code}`;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t.join.title}</CardTitle>
        <CardDescription>
          {signedIn ? t.join.invitedDescription : t.join.signInDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-1 rounded-lg border py-6">
          <span className="text-xs text-muted-foreground">
            {t.join.roomCodeLabel}
          </span>
          <code className="font-mono text-2xl font-semibold tracking-widest">
            {code}
          </code>
        </div>

        {signedIn ? (
          <Button onClick={joinRoom} disabled={busy}>
            {busy ? t.join.joining : t.join.joinRoom}
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              href={`/auth?next=${encodeURIComponent(next)}`}
              className={buttonVariants()}
            >
              {t.join.signInToJoin}
            </Link>
            <Link
              href={`/auth?mode=register&next=${encodeURIComponent(next)}`}
              className={buttonVariants({ variant: "outline" })}
            >
              {t.join.newHereRegister}
            </Link>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
