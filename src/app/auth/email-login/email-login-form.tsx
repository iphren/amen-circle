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
import { useTranslations } from "@/components/i18n-provider";
import { interpolate } from "@/lib/i18n/interpolate";

export function EmailLoginForm() {
  const t = useTranslations();
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
        <CardTitle>{t.emailLogin.title}</CardTitle>
        <CardDescription>
          {sent ? t.emailLogin.checkInbox : t.emailLogin.prompt}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sent ? (
          <>
            <p className="text-sm text-muted-foreground">
              {interpolate(t.emailLogin.sentNote, { email })}
            </p>
            <Link
              href="/auth"
              className="text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {t.common.backToSignIn}
            </Link>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t.common.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.common.emailPlaceholder}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={busy || email.trim().length === 0}
              className="mt-2"
            >
              {busy ? t.emailLogin.sending : t.emailLogin.sendLink}
            </Button>
            <Link
              href="/auth"
              className="mt-2 text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {t.common.backToSignIn}
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
