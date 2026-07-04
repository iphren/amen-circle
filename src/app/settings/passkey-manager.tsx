"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/lib/i18n/interpolate";

interface Passkey {
  id: string;
  deviceType: string;
  name: string | null;
  createdAt: string;
}

export function PasskeyManager({
  initialPasskeys,
}: {
  initialPasskeys: Passkey[];
}) {
  const { locale, t } = useI18n();
  const router = useRouter();

  // Legacy passkeys enrolled before names were stored have a null name; fall
  // back to the old deviceType-based label so they still read sensibly.
  function passkeyLabel(pk: Passkey): string {
    if (pk.name) return pk.name;
    return pk.deviceType === "multiDevice"
      ? t.settings.syncedPasskey
      : t.settings.deviceBoundPasskey;
  }
  const [passkeys, setPasskeys] = useState<Passkey[]>(initialPasskeys);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  async function handleAdd() {
    setBusy(true);
    setError(null);
    try {
      const optsRes = await fetch("/api/auth/passkeys/start", {
        method: "POST",
      });
      if (!optsRes.ok) throw new Error(t.settings.couldNotStartEnrollment);
      const options = await optsRes.json();
      const attResp = await startRegistration({ optionsJSON: options });
      const finishRes = await fetch("/api/auth/passkeys/finish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(attResp),
      });
      if (!finishRes.ok) {
        const j = await finishRes.json().catch(() => ({}));
        throw new Error(j.error ?? t.settings.enrollmentFailed);
      }
      router.refresh();
      // Refresh server data; also reflect immediately.
      const listRes = await fetch("/api/auth/passkeys");
      if (listRes.ok) setPasskeys(await listRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : t.settings.couldNotAddPasskey);
    } finally {
      setBusy(false);
    }
  }

  function startEditing(pk: Passkey) {
    setError(null);
    setEditingId(pk.id);
    setDraftName(passkeyLabel(pk));
  }

  function cancelEditing() {
    setEditingId(null);
    setDraftName("");
  }

  async function handleRename(id: string) {
    const name = draftName.trim();
    if (!name) {
      setError(t.settings.nameCannotBeEmpty);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/passkeys/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.settings.couldNotRenamePasskey);
      }
      const updated = await res.json();
      setPasskeys((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: updated.name } : p)),
      );
      cancelEditing();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.settings.couldNotRenamePasskey);
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
        throw new Error(j.error ?? t.settings.couldNotRemovePasskey);
      }
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.settings.couldNotRemovePasskey);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.settings.passkeysTitle}</CardTitle>
        <CardDescription>{t.settings.passkeysDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col divide-y">
          {passkeys.map((pk) => (
            <li
              key={pk.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0"
            >
              {editingId === pk.id ? (
                <>
                  <Input
                    autoFocus
                    value={draftName}
                    maxLength={60}
                    disabled={busy}
                    aria-label={t.settings.passkeyNameLabel}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(pk.id);
                      if (e.key === "Escape") cancelEditing();
                    }}
                  />
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      disabled={busy || !draftName.trim()}
                      onClick={() => handleRename(pk.id)}
                    >
                      {t.settings.save}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={cancelEditing}
                    >
                      {t.settings.cancel}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">
                      {passkeyLabel(pk)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {interpolate(t.settings.passkeyAdded, {
                        date: formatDate(pk.createdAt, locale),
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => startEditing(pk)}
                    >
                      {t.settings.rename}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busy || passkeys.length <= 1}
                      onClick={() => handleRemove(pk.id)}
                    >
                      {t.settings.remove}
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        {passkeys.length <= 1 && (
          <p className="text-xs text-muted-foreground">
            {t.settings.onlyPasskeyNote}
          </p>
        )}

        <Button onClick={handleAdd} disabled={busy} variant="outline">
          {busy ? t.settings.working : t.settings.addBackupPasskey}
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
