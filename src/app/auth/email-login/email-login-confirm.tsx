"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmailLoginConfirm({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login/email/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "This sign-in link is invalid or expired.");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to Amen Circle</CardTitle>
        <CardDescription>
          Click below to finish signing in on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button onClick={handleSignIn} disabled={busy} className="mt-2">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        {error && (
          <>
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
            <Link
              href="/auth/email-login"
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
