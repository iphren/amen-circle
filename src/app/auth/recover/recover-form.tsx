"use client";

import { useState } from "react";
import Link from "next/link";
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

export function RecoverForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    try {
      await fetch("/api/auth/recover/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Always show the same confirmation, regardless of outcome, so the page
      // never reveals whether an account exists.
      setSent(true);
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Recover your account</CardTitle>
        <CardDescription>
          {sent
            ? "Check your inbox."
            : "Lost the device with your passkey? Enter your email and we'll send a recovery link."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sent ? (
          <>
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent
              a recovery link. It expires in 20 minutes. Setting up a new passkey
              will remove the old ones from your account.
            </p>
            <Link
              href="/auth"
              className="text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={busy || email.trim().length === 0}
              className="mt-2"
            >
              {busy ? "Sending…" : "Send recovery link"}
            </Button>
            <Link
              href="/auth"
              className="mt-2 text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
