"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api";
import { useUi } from "../../ui";

interface Setup {
  factorId: string;
  qr: string;
  secret: string;
}

export default function SecurityPanel({ forced = false }: { forced?: boolean }) {
  const { toast, confirm } = useUi();
  const [status, setStatus] = useState<{ enabled: boolean; required: boolean } | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setStatus(await adminApi("/api/admin/mfa"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function start() {
    setBusy(true);
    setError("");
    try {
      setSetup(await adminApi("/api/admin/mfa/enroll", { method: "POST" }));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function verify(value: string) {
    if (!setup || busy) return;
    setBusy(true);
    setError("");
    try {
      await adminApi("/api/admin/mfa/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ factorId: setup.factorId, code: value }) });
      setSetup(null);
      setCode("");
      toast({ text: "Two-step login is on. You'll be asked for a code each time you sign in." });
      if (forced) window.location.reload();
      else await load();
    } catch (e) {
      setError((e as Error).message);
      setCode("");
    }
    setBusy(false);
  }

  function onCode(v: string) {
    const clean = v.replace(/[^\d ]/g, "");
    setCode(clean);
    // Submits by itself on the sixth digit.
    if (clean.replace(/\s/g, "").length === 6) verify(clean.replace(/\s/g, ""));
  }

  async function disable() {
    const r = await confirm({ title: "Turn off two-step login?", body: "Your account will be protected by the password alone, and you will be signed out.", confirmLabel: "Turn off two-step login", cancelLabel: "Keep it on", danger: true });
    if (r.choice !== "confirm") return;
    setBusy(true);
    setError("");
    try {
      await adminApi("/api/admin/mfa", { method: "DELETE" });
      window.location.href = "/admin/login";
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function signOutEverywhere() {
    const r = await confirm({ title: "Sign out of all devices?", body: "This also signs you out of this device.", confirmLabel: "Sign out everywhere", cancelLabel: "Stay signed in", danger: true });
    if (r.choice !== "confirm") return;
    await fetch("/api/admin/logout?all=1", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ text: "Copied." });
    } catch {
      toast({ text: "Could not copy. Select the key and copy it by hand.", tone: "error" });
    }
  }

  const otpUri = setup ? `otpauth://totp/KG%20Foods%20Admin?secret=${encodeURIComponent(setup.secret)}&issuer=KG%20Foods%20Admin` : "";
  const card = "rounded-2xl border border-warm-gray bg-white p-5";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        {forced && <p className="mb-1 text-base font-semibold text-accent">Before you start</p>}
        <h1 className="font-display text-2xl sm:text-3xl">{forced ? "Set up two-step login" : "Security"}</h1>
        <p className="text-base text-secondary-text">
          {forced ? "For safety, every admin must use two-step login before using the admin." : "Protect the account that can change prices and see customer details."}
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

      <section className={card}>
        <div className="mb-1 flex items-center gap-2">
          <h2 className="font-body text-lg font-semibold">Two-step login</h2>
          {status && (
            <span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${status.enabled ? "bg-success/10 text-success" : "bg-amber-100 text-amber-800"}`}>{status.enabled ? "On" : "Off"}</span>
          )}
        </div>
        <p className="mb-4 text-base text-secondary-text">
          After your password you enter a 6-digit code from an app on your phone (Google Authenticator, Microsoft Authenticator, Authy…). A stolen password alone can no longer get into the admin.
        </p>

        {status?.enabled ? (
          status.required ? (
            <p className="text-base font-medium text-secondary-text">Required for all admins</p>
          ) : (
            <button onClick={disable} disabled={busy} className="min-h-12 rounded-full border border-red-200 px-5 text-base font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">Turn off two-step login</button>
          )
        ) : setup ? (
          <div className="space-y-5">
            <ol className="list-inside list-decimal space-y-1 text-base">
              <li>Open an authenticator app on your phone.</li>
              <li>Add an account by scanning this picture, or use one of the other ways below.</li>
              <li>Type the 6-digit code the app shows.</li>
            </ol>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qr} alt="QR code to scan with your authenticator app" className="h-48 w-48 rounded-xl border border-warm-gray bg-white p-2" />
            <div className="space-y-3">
              <a href={otpUri} className="flex min-h-12 items-center justify-center rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream sm:inline-flex">On this phone? Open your authenticator app</a>
              <div>
                <p className="text-base text-secondary-text">Can't scan? Type this key in the app:</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-lg bg-cream px-3 py-3 text-base text-primary-text">{setup.secret}</code>
                  <button onClick={() => copy(setup.secret)} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream">Copy</button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                value={code}
                onChange={(e) => onCode(e.target.value)}
                placeholder="6-digit code"
                aria-label="6-digit code"
                className="min-h-12 w-56 rounded-xl border border-warm-gray px-4 text-center text-xl tracking-[0.25em] outline-none focus:border-accent"
              />
              <button onClick={() => verify(code.replace(/\s/g, ""))} disabled={busy || code.replace(/\s/g, "").length !== 6} className="btn-primary min-h-12 !text-base disabled:opacity-60">
                {busy ? "Checking…" : "Turn on"}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={start} disabled={busy || !status} className="btn-primary min-h-12 !text-base disabled:opacity-60">{busy ? "Starting…" : "Set up two-step login"}</button>
        )}
      </section>

      {!forced && (
        <section className={card}>
          <h2 className="mb-1 font-body text-lg font-semibold">Sessions</h2>
          <p className="mb-3 text-base text-secondary-text">Use this if you signed in on a shared computer or lost a device. It ends every admin session, including this one.</p>
          <button onClick={signOutEverywhere} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream">Sign out of all devices</button>
        </section>
      )}

      {!forced && (
        <p className="text-base text-secondary-text">
          Lost your phone? Another admin cannot reset it from here yet. Open Supabase, Authentication, Users, choose your user and delete the authenticator, then sign in again.
        </p>
      )}
    </div>
  );
}
