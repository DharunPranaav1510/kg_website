"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const CODE_SECONDS = 5 * 60;
const input = "mt-1 min-h-12 w-full rounded-xl border border-warm-gray px-3 text-base outline-none focus:border-accent";

export default function LoginForm() {
  const [step, setStep] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const [left, setLeft] = useState(CODE_SECONDS);
  const sending = useRef(false);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  }

  // The code step must be finished within 5 minutes; show the clock.
  useEffect(() => {
    if (step !== "code") return;
    setLeft(CODE_SECONDS);
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [step]);
  useEffect(() => {
    if (step === "code" && left === 0) {
      setStep("password");
      setPassword("");
      setCode("");
      setError("That took more than 5 minutes. For safety, enter your password again.");
    }
  }, [left, step]);

  async function submitPassword(e?: React.FormEvent) {
    e?.preventDefault();
    if (sending.current) return; // a double tap must not use up two tries
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await post("/api/admin/login", { email, password });
      if (ok && data.mfaRequired) {
        setStep("code");
      } else if (ok) {
        window.location.href = "/admin";
        return;
      } else {
        setError(data.error ?? "Sign-in failed. Check your email and password and try again.");
      }
    } catch {
      setError("Could not reach the server. Check your internet connection and try again.");
    }
    sending.current = false;
    setBusy(false);
  }

  async function submitCode(value: string) {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await post("/api/admin/login/mfa", { code: value });
      if (ok) {
        window.location.href = "/admin";
        return;
      }
      setError(data.error ?? "That code didn't match. Codes change every 30 seconds, so use the newest one.");
      setCode("");
      if (data.restart) {
        setStep("password");
        setPassword("");
      }
    } catch {
      setError("Could not reach the server. Check your internet connection and try again.");
    }
    sending.current = false;
    setBusy(false);
  }

  function onCode(v: string) {
    const clean = v.replace(/[^\d ]/g, "");
    setCode(clean);
    // Submits by itself on the sixth digit, and accepts a pasted code.
    if (clean.replace(/\s/g, "").length === 6) submitCode(clean.replace(/\s/g, ""));
  }

  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px] space-y-4">
        <form onSubmit={step === "password" ? submitPassword : (e) => { e.preventDefault(); submitCode(code.replace(/\s/g, "")); }} className="space-y-4 rounded-2xl border border-warm-gray bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="font-display text-lg text-secondary-text">KG Foods</p>
            <h1 className="font-display text-2xl text-primary-text">{step === "password" ? "Admin sign in" : "Enter your 6-digit code"}</h1>
            <p className="mt-1 text-base text-secondary-text">{step === "password" ? "KG Foods staff only." : "Step 2 of 2 · from your authenticator app"}</p>
          </div>

          {step === "password" ? (
            <>
              <label className="block text-base font-medium text-primary-text">
                Email
                <input type="email" required inputMode="email" autoComplete="username" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
              </label>
              <label className="block text-base font-medium text-primary-text">
                Password
                <span className="relative mt-1 block">
                  <input type={showPw ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} !mt-0 pr-20`} />
                  <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw} className="absolute inset-y-0 right-1 min-w-[4rem] rounded-lg px-3 text-base font-medium text-accent">
                    {showPw ? "Hide" : "Show"}
                  </button>
                </span>
              </label>
            </>
          ) : (
            <>
              <label className="block text-base font-medium text-primary-text">
                6-digit code
                <input
                  autoFocus
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9 ]*"
                  maxLength={7}
                  value={code}
                  onChange={(e) => onCode(e.target.value)}
                  className={`${input} text-center text-2xl tracking-[0.4em]`}
                  placeholder="······"
                />
              </label>
              <p className="text-base text-secondary-text" aria-live="off">{mm} left to enter the code</p>
            </>
          )}

          {error && <p role="alert" className="text-base font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary min-h-12 w-full !text-base disabled:opacity-60">
            {busy ? <><Loader2 size={18} className="animate-spin" /> Checking…</> : step === "password" ? "Sign in" : "Sign in"}
          </button>

          {step === "password" ? (
            <button type="button" onClick={() => setHelp((h) => !h)} aria-expanded={help} className="min-h-12 w-full text-base text-secondary-text hover:text-accent">Can&apos;t sign in?</button>
          ) : (
            <button type="button" onClick={() => { setStep("password"); setCode(""); setError(""); }} className="min-h-12 w-full text-base text-secondary-text hover:text-accent">← Back to password</button>
          )}
        </form>

        {help && step === "password" && (
          <section className="rounded-2xl border border-warm-gray bg-white p-5 text-base">
            <h2 className="mb-2 font-body text-lg font-semibold">Can&apos;t sign in?</h2>
            <ul className="space-y-2 text-secondary-text">
              <li><b className="text-primary-text">Wrong password.</b> Check the email and password, then use Show to see what you typed. Five wrong tries in a row lock sign-in for 15 minutes.</li>
              <li><b className="text-primary-text">Correct password, but it still fails.</b> Your email may not be on the admin list yet. Ask the owner to add you.</li>
              <li><b className="text-primary-text">The code does not work.</b> Codes change every 30 seconds. Use the newest one, and check that your phone&apos;s clock is set automatically.</li>
              <li><b className="text-primary-text">Lost your phone or password.</b> Ask the owner to help you. They can reset your access in Supabase.</li>
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
