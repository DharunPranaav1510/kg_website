"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api";

interface Setup {
  factorId: string;
  qr: string;
  secret: string;
}

export default function SecurityPanel({ forced = false }: { forced?: boolean }) {
  const [status, setStatus] = useState<{ enabled: boolean; required: boolean } | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

  async function confirm() {
    if (!setup) return;
    setBusy(true);
    setError("");
    try {
      await adminApi("/api/admin/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId: setup.factorId, code }),
      });
      setSetup(null);
      setCode("");
      setNotice("Two-step login is on. You'll be asked for a code each time you sign in.");
      if (forced) window.location.reload();
      else await load();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function disable() {
    if (!window.confirm("Turn off two-step login? Your account will be protected by the password alone.")) return;
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
    if (!window.confirm("Sign out of every device, including this one?")) return;
    await fetch("/api/admin/logout?all=1", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">{forced ? "Set up two-step login" : "Security"}</h1>
        <p className="text-sm text-secondary-text">
          {forced
            ? "For safety, every admin must use two-step login before using the admin panel."
            : "Protect the admin account that can change prices and see customer details."}
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">✓ {notice}</p>}

      <section className="rounded-2xl border border-warm-gray bg-white p-5">
        <div className="mb-1 flex items-center gap-2">
          <h2 className="font-medium">Two-step login</h2>
          {status && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.enabled ? "bg-success/10 text-success" : "bg-amber-100 text-amber-800"}`}>
              {status.enabled ? "On" : "Off"}
            </span>
          )}
        </div>
        <p className="mb-4 text-sm text-secondary-text">
          After your password you enter a 6-digit code from an app on your phone (Google Authenticator, Microsoft Authenticator, Authy…). A stolen password alone can no longer get into the admin.
        </p>

        {status?.enabled ? (
          <button onClick={disable} disabled={busy || status.required} className="text-sm text-red-600 hover:underline disabled:opacity-50">
            {status.required ? "Required for all admins" : "Turn off two-step login"}
          </button>
        ) : setup ? (
          <div className="space-y-4">
            <ol className="list-inside list-decimal space-y-1 text-sm">
              <li>Open an authenticator app on your phone.</li>
              <li>Choose <b>Add account → Scan QR code</b> and scan this picture.</li>
              <li>Type the 6-digit code the app shows.</li>
            </ol>
            <div className="flex flex-wrap items-center gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qr} alt="QR code to scan with your authenticator app" className="h-44 w-44 rounded-xl border border-warm-gray bg-white p-2" />
              <div className="min-w-0 flex-1 text-xs text-secondary-text">
                Can't scan? Enter this key in the app instead:
                <code className="mt-1 block break-all rounded-lg bg-cream px-3 py-2 text-sm text-primary-text">{setup.secret}</code>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
                placeholder="6-digit code"
                aria-label="6-digit code"
                className="w-52 rounded-xl border border-warm-gray px-4 py-2.5 text-center text-lg tracking-[0.25em] outline-none focus:border-accent"
              />
              <button onClick={confirm} disabled={busy || code.replace(/\s/g, "").length !== 6} className="btn-primary !py-2.5 disabled:opacity-60">
                {busy ? "Checking…" : "Turn on"}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={start} disabled={busy || !status} className="btn-primary !py-2.5 disabled:opacity-60">
            {busy ? "Starting…" : "Set up two-step login"}
          </button>
        )}
      </section>

      {!forced && (
        <section className="rounded-2xl border border-warm-gray bg-white p-5">
          <h2 className="mb-1 font-medium">Sign out everywhere</h2>
          <p className="mb-3 text-sm text-secondary-text">
            Use this if you logged in on a shared computer or lost a device. It ends every admin session, including this one.
          </p>
          <button onClick={signOutEverywhere} className="btn-secondary !py-2 !px-4 !text-sm">Sign out of all devices</button>
        </section>
      )}

      {!forced && (
        <p className="text-xs text-secondary-text">
          Lost your phone? Another admin can't reset it here. Open Supabase → Authentication → Users → your user → delete the authenticator factor, then sign in again.
        </p>
      )}
    </div>
  );
}
