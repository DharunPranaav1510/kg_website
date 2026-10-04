"use client";

import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.location.href = "/admin";
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl border border-warm-gray p-6 sm:p-8 shadow-sm space-y-4"
      >
        <div>
          <h1 className="font-display text-2xl text-primary-text">Admin login</h1>
          <p className="text-sm text-secondary-text mt-1">KG Foods staff only.</p>
        </div>
        <label className="block text-sm font-medium text-primary-text">
          Email
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-warm-gray px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block text-sm font-medium text-primary-text">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-warm-gray px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
