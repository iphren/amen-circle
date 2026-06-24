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

export function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    try {
      await fetch("/api/auth/login/email/start", {
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
        <CardTitle>Sign in with an email link</CardTitle>
        <CardDescription>
          {sent
            ? "Check your inbox."
            : "Trouble with your passkey? Enter your email and we'll send you a link to sign in."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sent ? (
          <>
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent
              a sign-in link. It expires in 15 minutes and can be used once.
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
              {busy ? "Sending…" : "Send sign-in link"}
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
