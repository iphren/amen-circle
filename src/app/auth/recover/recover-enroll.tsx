"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RecoverEnroll({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecover() {
    setBusy(true);
    setError(null);
    try {
      const verifyRes = await fetch("/api/auth/recover/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!verifyRes.ok) {
        const j = await verifyRes.json().catch(() => ({}));
        throw new Error(j.error ?? "This recovery link is invalid or expired.");
      }
      const options = await verifyRes.json();
      const attResp = await startRegistration({ optionsJSON: options });
      const finishRes = await fetch("/api/auth/recover/finish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(attResp),
      });
      if (!finishRes.ok) {
        const j = await finishRes.json().catch(() => ({}));
        throw new Error(j.error ?? "could not set up your new passkey");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "recovery failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set up a new passkey</CardTitle>
        <CardDescription>
          This finishes recovering your account. Your old passkeys will be
          removed and replaced with a new one on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button onClick={handleRecover} disabled={busy} className="mt-2">
          {busy ? "Setting up…" : "Create new passkey"}
        </Button>
        {error && (
          <>
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
            <Link
              href="/auth/recover"
              className="text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Request a new link
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
