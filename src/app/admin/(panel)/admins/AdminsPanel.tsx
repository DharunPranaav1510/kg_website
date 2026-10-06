"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { adminApi } from "../../api";

export default function AdminsPanel() {
  const [owner, setOwner] = useState("");
  const [admins, setAdmins] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await adminApi("/api/admin/admins");
      setOwner(d.owner);
      setAdmins(d.admins);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const d = await adminApi("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      setNotice(d.loginCreated ? `${d.email} can now sign in with the password you set. Share it with them privately.` : `${d.email} can now use the admin panel.`);
      setEmail("");
      setPassword("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  async function remove(who: string) {
    if (!window.confirm(`Remove ${who}? They will lose access to the admin panel.`)) return;
    setError("");
    setNotice("");
    try {
      await adminApi(`/api/admin/admins?email=${encodeURIComponent(who)}`, { method: "DELETE" });
      setNotice(`${who} was removed.`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">Admins</h1>
        <p className="text-sm text-secondary-text">Only you ({owner || "the owner"}) can see this page and add or remove admins.</p>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{notice}</p>}

      <form onSubmit={add} className="space-y-3 rounded-2xl border border-warm-gray bg-white p-5">
        <h2 className="font-medium">Add an admin</h2>
        <label className="block text-sm font-medium">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" className="mt-1 w-full rounded-xl border border-warm-gray px-3 py-2.5 text-sm outline-none focus:border-accent" />
        </label>
        <label className="block text-sm font-medium">
          Password for their new login
          <span className="relative mt-1 block">
            <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={10} autoComplete="new-password" placeholder="At least 10 characters" className="w-full rounded-xl border border-warm-gray py-2.5 pl-3 pr-11 text-sm outline-none focus:border-accent" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text">
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
          <span className="mt-1 block text-xs font-normal text-secondary-text">Leave empty if this person already has a login. Tell them the password yourself and ask them to set up two-step login.</span>
        </label>
        <button disabled={busy || !email.trim()} className="btn-primary disabled:opacity-50">{busy ? "Adding…" : "Add admin"}</button>
      </form>

      <section className="rounded-2xl border border-warm-gray bg-white p-5">
        <h2 className="mb-2 font-medium">Current admins</h2>
        <ul className="divide-y divide-warm-gray/70">
          {admins.map((a) => (
            <li key={a} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="flex-1 truncate">{a}</span>
              {a.toLowerCase() === owner ? (
                <span className="rounded-full bg-warm-gray px-2.5 py-0.5 text-xs text-secondary-text">Owner</span>
              ) : (
                <button onClick={() => remove(a)} aria-label={`Remove ${a}`} className="text-secondary-text hover:text-red-600"><Trash2 size={16} /></button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
