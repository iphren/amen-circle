"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
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
import { ConsentCheckboxes } from "@/components/consent-checkboxes";

type Mode = "login" | "register";

export function PasskeyForm({
  initialMode,
  next = "/dashboard",
}: {
  initialMode: Mode;
  next?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [consentReligiousData, setConsentReligiousData] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setBusy(true);
    setError(null);
    try {
      const optsRes = await fetch("/api/auth/register/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          acceptTerms,
          consentReligiousData,
        }),
      });
      if (!optsRes.ok) {
        const j = await optsRes.json().catch(() => ({}));
        throw new Error(j.error ?? "could not start registration");
      }
      const options = await optsRes.json();
      const attResp = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch("/api/auth/register/finish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(attResp),
      });
      if (!verifyRes.ok) {
        const j = await verifyRes.json().catch(() => ({}));
        throw new Error(j.error ?? "registration verification failed");
      }
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin() {
    setBusy(true);
    setError(null);
    try {
      const optsRes = await fetch("/api/auth/login/start", { method: "POST" });
      if (!optsRes.ok) throw new Error("could not start sign-in");
      const options = await optsRes.json();
      const authResp = await startAuthentication({ optionsJSON: options });
      const verifyRes = await fetch("/api/auth/login/finish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(authResp),
      });
      if (!verifyRes.ok) {
        const j = await verifyRes.json().catch(() => ({}));
        throw new Error(j.error ?? "sign-in failed");
      }
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  const canRegister =
    email.trim().length > 0 &&
    displayName.trim().length > 0 &&
    acceptTerms &&
    consentReligiousData;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {mode === "register" ? "Create your passkey" : "Sign in with passkey"}
        </CardTitle>
        <CardDescription>
          {mode === "register"
            ? "We'll save a passkey on this device — no password needed."
            : "Pick the passkey for the account you want to use."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {mode === "register" ? (
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others will see you"
              />
            </div>
            <ConsentCheckboxes
              idPrefix="register"
              acceptTerms={acceptTerms}
              onAcceptTermsChange={setAcceptTerms}
              consentReligiousData={consentReligiousData}
              onConsentReligiousDataChange={setConsentReligiousData}
            />
            <Button
              onClick={handleRegister}
              disabled={busy || !canRegister}
              className="mt-2"
            >
              {busy ? "Creating passkey…" : "Create passkey"}
            </Button>
          </>
        ) : (
          <Button onClick={handleLogin} disabled={busy} className="mt-2">
            {busy ? "Waiting for passkey…" : "Continue with passkey"}
          </Button>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="mt-2 text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => {
            setError(null);
            setMode(mode === "register" ? "login" : "register");
          }}
        >
          {mode === "register"
            ? "Have an account? Sign in"
            : "New here? Register"}
        </button>

        {mode === "login" && (
          <>
            <Link
              href="/auth/email-login"
              className="text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Trouble with your passkey? Email me a sign-in link
            </Link>
            <Link
              href="/auth/recover"
              className="text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Lost your device?
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
