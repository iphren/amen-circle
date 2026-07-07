"use client";

import Link from "next/link";
import { useState } from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { useTranslations } from "@/components/i18n-provider";
import { interpolate } from "@/lib/i18n/interpolate";

type Mode = "login" | "register";

export function PasskeyForm({
  initialMode,
  next = "/dashboard",
}: {
  initialMode: Mode;
  next?: string;
}) {
  const t = useTranslations();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [consentReligiousData, setConsentReligiousData] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupLinkSent, setSignupLinkSent] = useState(false);

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
        throw new Error(j.error ?? t.auth.errors.couldNotStartRegistration);
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
        throw new Error(j.error ?? t.auth.errors.registrationVerificationFailed);
      }
      window.location.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.auth.errors.registrationFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailRegister() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register/email/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          acceptTerms,
          consentReligiousData,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.auth.errors.couldNotSendSignupLink);
      }
      setSignupLinkSent(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t.auth.errors.couldNotSendSignupLink,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin() {
    setBusy(true);
    setError(null);
    try {
      const optsRes = await fetch("/api/auth/login/start", { method: "POST" });
      if (!optsRes.ok) throw new Error(t.auth.errors.couldNotStartSignIn);
      const options = await optsRes.json();
      const authResp = await startAuthentication({ optionsJSON: options });
      const verifyRes = await fetch("/api/auth/login/finish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(authResp),
      });
      if (!verifyRes.ok) {
        const j = await verifyRes.json().catch(() => ({}));
        throw new Error(j.error ?? t.auth.errors.signInFailed);
      }
      window.location.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.auth.errors.signInFailed);
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
          {mode === "register" ? t.auth.createTitle : t.auth.signInTitle}
        </CardTitle>
        <CardDescription>
          {mode === "register"
            ? signupLinkSent
              ? t.emailLogin.checkInbox
              : t.auth.createDescription
            : t.auth.signInDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {mode === "register" ? (
          signupLinkSent ? (
            <p className="text-sm text-muted-foreground">
              {interpolate(t.auth.signupLinkSentNote, { email })}
            </p>
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="displayName">{t.auth.displayNameLabel}</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t.auth.displayNamePlaceholder}
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
                {busy ? t.auth.creatingPasskey : t.auth.createPasskey}
              </Button>
              <Button
                variant="secondary"
                onClick={handleEmailRegister}
                disabled={busy || !canRegister}
              >
                {busy ? t.auth.sendingSignupLink : t.auth.emailSignupLink}
              </Button>
            </>
          )
        ) : (
          <>
            <Button onClick={handleLogin} disabled={busy} className="mt-2">
              {busy ? t.auth.waitingForPasskey : t.auth.continueWithPasskey}
            </Button>
            <Link
              href="/auth/email-login"
              className={buttonVariants({ variant: "secondary" })}
            >
              {t.auth.troublePasskey}
            </Link>
          </>
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
            setSignupLinkSent(false);
            setMode(mode === "register" ? "login" : "register");
          }}
        >
          {mode === "register" ? t.auth.haveAccount : t.auth.newHere}
        </button>

        {mode === "login" && (
          <Link
            href="/auth/recover"
            className="text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {t.auth.lostDevice}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
