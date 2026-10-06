"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { checkPassword } from "@/lib/password";

const input = "w-full rounded-xl border border-warm-gray bg-white px-3.5 py-3 text-base outline-none focus:border-accent";

export default function InviteForm({ token, maskedEmail, invitedBy }: { token: string; maskedEmail: string; invitedBy: string }) {
  const [step, setStep] = useState<"start" | "details" | "done">("start");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);
  const [devCode, setDevCode] = useState("");

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  }

  async function sendCode() {
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await post("/api/admin/invite/code", { token });
      if (ok) {
        setStep("details");
        setWait(data.resendIn ?? 60);
        setDevCode(data.devCode ?? "");
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
        if (data.wait) setWait(data.wait);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  }

  const check = checkPassword(pw);
  const same = pw.length > 0 && pw === pw2;
  const ready = /^\d{6}$/.test(code) && check.ok && same;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await post("/api/admin/invite/accept", { token, code, password: pw });
      if (ok) setStep("done");
      else {
        setError(data.error ?? "Something went wrong. Please try again.");
        if (data.needNewCode) setCode("");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  }

  if (step === "done") {
    return (
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success"><Check size={28} /></span>
        <h1 className="font-display text-2xl">You&apos;re all set</h1>
        <p className="mt-2 text-sm text-secondary-text">Your admin account is ready. Sign in with your email and the password you just chose.</p>
        <a href="/admin/login" className="btn-primary mt-6 w-full">Go to sign in</a>
      </div>
    );
  }

  if (step === "start") {
    return (
      <div>
        <h1 className="font-display text-2xl">Join as an admin</h1>
        <p className="mt-2 text-sm text-secondary-text"><b className="text-primary-text">{invitedBy}</b> invited you to manage the shop. First we verify your email: we will send a 6-digit code to <b className="text-primary-text">{maskedEmail}</b>.</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        <button type="button" onClick={sendCode} disabled={busy} className="btn-primary mt-6 min-h-12 w-full disabled:opacity-60">
          {busy ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : "Email me the code"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={create} className="space-y-4" noValidate>
      <div>
        <h1 className="font-display text-2xl">Verify and set your password</h1>
        <p className="mt-1 text-sm text-secondary-text">We sent a code to <b className="text-primary-text">{maskedEmail}</b>. It works for 10 minutes.</p>
      </div>
      {devCode && <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900">Test mode (no email key): your code is <b>{devCode}</b></p>}

      <label className="block text-sm font-medium">
        6-digit code
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className={`${input} mt-1 text-center font-mono text-2xl tracking-[0.5em]`}
          aria-label="Verification code"
          placeholder="••••••"
          autoFocus
        />
      </label>
      <button type="button" onClick={sendCode} disabled={busy || wait > 0} className="-mt-2 text-xs text-secondary-text underline disabled:no-underline disabled:opacity-60">
        {wait > 0 ? `Send a new code in ${wait}s` : "Send me a new code"}
      </button>

      <label className="block text-sm font-medium">
        New password
        <span className="relative mt-1 block">
          <input type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={`${input} pr-16`} />
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-3 flex items-center text-secondary-text">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      <ul className="space-y-1 text-xs" aria-label="Password rules">
        {check.rules.map((r) => (
          <li key={r.label} className={pw ? (r.ok ? "text-success" : "text-secondary-text") : "text-secondary-text"}>{pw && r.ok ? "✓" : "•"} {r.label}</li>
        ))}
      </ul>
      <label className="block text-sm font-medium">
        Type it again
        <input type={show ? "text" : "password"} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={`${input} mt-1`} />
        {pw2 && !same && <span className="mt-1 block text-xs text-accent">The two passwords don&apos;t match.</span>}
      </label>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={!ready || busy} className="btn-primary min-h-12 w-full disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? "Creating…" : "Create my account"}
      </button>
    </form>
  );
}
