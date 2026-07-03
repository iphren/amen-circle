"use client";

import { useState } from "react";
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
import { formatDate } from "@/lib/utils";

interface Passkey {
  id: string;
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
}

export function PasskeyManager({
  initialPasskeys,
}: {
  initialPasskeys: Passkey[];
}) {
  const router = useRouter();
  const [passkeys, setPasskeys] = useState<Passkey[]>(initialPasskeys);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setBusy(true);
    setError(null);
    try {
      const optsRes = await fetch("/api/auth/passkeys/start", {
        method: "POST",
      });
      if (!optsRes.ok) throw new Error("could not start enrollment");
      const options = await optsRes.json();
      const attResp = await startRegistration({ optionsJSON: options });
      const finishRes = await fetch("/api/auth/passkeys/finish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(attResp),
      });
      if (!finishRes.ok) {
        const j = await finishRes.json().catch(() => ({}));
        throw new Error(j.error ?? "enrollment failed");
      }
      router.refresh();
      // Refresh server data; also reflect immediately.
      const listRes = await fetch("/api/auth/passkeys");
      if (listRes.ok) setPasskeys(await listRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not add passkey");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/passkeys/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "could not remove passkey");
      }
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not remove passkey");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Passkeys</CardTitle>
        <CardDescription>
          Add a backup passkey on another device so you don&apos;t get locked
          out if you lose this one.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col divide-y">
          {passkeys.map((pk) => (
            <li
              key={pk.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {pk.deviceType === "multiDevice"
                    ? "Synced passkey"
                    : "Device-bound passkey"}
                  {pk.backedUp && (
                    <span className="ml-2 text-xs text-emerald-700">
                      backed up
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Added {formatDate(pk.createdAt)}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={busy || passkeys.length <= 1}
                onClick={() => handleRemove(pk.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>

        {passkeys.length <= 1 && (
          <p className="text-xs text-muted-foreground">
            You can&apos;t remove your only passkey. Add a backup first.
          </p>
        )}

        <Button onClick={handleAdd} disabled={busy} variant="outline">
          {busy ? "Working…" : "Add a backup passkey"}
        </Button>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
