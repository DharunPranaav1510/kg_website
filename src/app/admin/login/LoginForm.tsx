"use client";

import { useState } from "react";

export default function LoginForm() {
  const [step, setStep] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (step === "password") {
        const { ok, data } = await post("/api/admin/login", { email, password });
        if (ok && data.mfaRequired) {
          setStep("code");
        } else if (ok) {
          window.location.href = "/admin";
          return;
        } else {
          setError(data.error ?? "Login failed");
        }
      } else {
        const { ok, data } = await post("/api/admin/login/mfa", { code });
        if (ok) {
          window.location.href = "/admin";
          return;
        }
        setError(data.error ?? "That code didn't work");
        setCode("");
        if (data.restart) {
          setStep("password");
          setPassword("");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  }

  const input =
    "mt-1 w-full rounded-xl border border-warm-gray px-3 py-2.5 text-base outline-none focus:border-accent";

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-warm-gray bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h1 className="font-display text-2xl text-primary-text">{step === "password" ? "Admin login" : "Two-step login"}</h1>
          <p className="mt-1 text-sm text-secondary-text">
            {step === "password" ? "KG Foods staff only." : "Open your authenticator app and enter the 6-digit code for KG Foods Admin."}
          </p>
        </div>

        {step === "password" ? (
          <>
            <label className="block text-sm font-medium text-primary-text">
              Email
              <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            </label>
            <label className="block text-sm font-medium text-primary-text">
              Password
              <span className="relative mt-1 block">
                <input type={showPw ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} !mt-0 pr-20`} />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw} className="absolute inset-y-0 right-3 text-sm font-medium text-accent">
                  {showPw ? "Hide" : "Show"}
                </button>
              </span>
            </label>
          </>
        ) : (
          <label className="block text-sm font-medium text-primary-text">
            6-digit code
            <input
              autoFocus
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
              className={`${input} text-center text-2xl tracking-[0.4em]`}
              placeholder="······"
            />
          </label>
        )}

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? "Checking…" : step === "password" ? "Continue" : "Sign in"}
        </button>
        {step === "code" && (
          <button type="button" onClick={() => { setStep("password"); setCode(""); setError(""); }} className="w-full text-sm text-secondary-text hover:text-accent">
            ← Back
          </button>
        )}
      </form>
    </main>
  );
}
