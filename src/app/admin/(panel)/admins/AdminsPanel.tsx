"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Plus } from "lucide-react";
import { adminApi } from "../../api";
import { MoreMenu, SidePanel, useUi } from "../../ui";

const randomPassword = () => {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

export default function AdminsPanel() {
  const { toast, confirm } = useUi();
  const [owner, setOwner] = useState("");
  const [admins, setAdmins] = useState<string[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState<{ email: string; password: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await adminApi("/api/admin/admins");
      setOwner(d.owner);
      setAdmins(d.admins);
    } catch (e) {
      setError((e as Error).message);
      setAdmins((a) => a ?? []);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEmail("");
    setMode("new");
    setPassword(randomPassword());
    setShow(true);
    setError("");
    setAdding(true);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await adminApi("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: mode === "new" ? password : "" }),
      });
      setAdding(false);
      if (d.loginCreated) setInvite({ email: d.email, password });
      else toast({ text: `${d.email} can now use the admin.` });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  async function remove(who: string) {
    const r = await confirm({ title: `Remove ${who}?`, body: "They lose access within 30 seconds.", confirmLabel: "Remove admin", cancelLabel: "Keep", danger: true });
    if (r.choice !== "confirm") return;
    try {
      await adminApi(`/api/admin/admins?email=${encodeURIComponent(who)}`, { method: "DELETE" });
      toast({ text: `${who} was removed.` });
      await load();
    } catch (err) {
      toast({ text: `Could not remove ${who}. ${(err as Error).message}`, tone: "error" });
    }
  }

  const message = invite
    ? `Hi! You can now use the KG Foods admin.\nSign in at: ${window.location.origin}/admin/login\nEmail: ${invite.email}\nTemporary password: ${invite.password}\nAfter signing in, open Security to set up two-step login.`
    : "";
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(message);
      toast({ text: "Message copied. Send it to them privately." });
    } catch {
      toast({ text: "Could not copy. Select the message and copy it by hand.", tone: "error" });
    }
  }

  const input = "min-h-12 w-full rounded-xl border border-warm-gray px-3 text-base outline-none focus:border-accent";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="font-display text-2xl sm:text-3xl">Admins</h1>
          <p className="text-base text-secondary-text">Only you ({owner || "the owner"}) can see this page and add or remove admins.</p>
        </div>
        <button onClick={openAdd} className="btn-primary min-h-12 !text-base"><Plus size={18} /> Add admin</button>
      </div>

      {error && !adding && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

      {invite && (
        <section className="rounded-2xl border border-success/40 bg-success/5 p-4">
          <h2 className="font-body text-lg font-semibold">{invite.email} can now sign in</h2>
          <p className="mb-2 text-base text-secondary-text">Send this message to them privately. The password is shown only now.</p>
          <pre className="whitespace-pre-wrap rounded-xl bg-white p-3 text-base">{message}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={copyInvite} className="btn-primary min-h-12 !text-base">Copy message</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center rounded-full border border-warm-gray bg-white px-6 text-base font-medium hover:bg-cream">Send on WhatsApp</a>
            <button onClick={() => setInvite(null)} className="min-h-12 px-4 text-base text-secondary-text underline">Done</button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-warm-gray bg-white p-5">
        <h2 className="mb-2 font-body text-lg font-semibold">Current admins</h2>
        {admins === null ? (
          <p className="text-base text-secondary-text">Loading…</p>
        ) : (
          <ul className="divide-y divide-warm-gray/70">
            {admins.map((a) => {
              const isOwner = a.toLowerCase() === owner;
              return (
                <li key={a} className="flex items-center gap-3 py-2 text-base">
                  <span className="min-w-0 flex-1 truncate">{a}</span>
                  {isOwner ? (
                    <span title="The owner cannot be removed" className="rounded-full bg-warm-gray px-3 py-1 text-sm font-medium text-secondary-text">Owner · cannot be removed</span>
                  ) : (
                    <MoreMenu items={[{ label: "Remove admin", onSelect: () => remove(a), danger: true }]} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <SidePanel
        open={adding}
        onClose={() => setAdding(false)}
        title="Add admin"
        footer={
          <button form="add-admin" disabled={busy || !email.trim() || (mode === "new" && password.length < 10)} className="btn-primary min-h-12 w-full !text-base disabled:opacity-50">
            {busy ? "Adding…" : "Add admin"}
          </button>
        }
      >
        <form id="add-admin" onSubmit={add} className="space-y-4">
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}
          <label className="block text-base font-medium">Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" className={`${input} mt-1`} />
          </label>
          <div role="radiogroup" aria-label="Login" className="grid gap-2">
            {([["new", "Create a new login", "They get a temporary password from you."], ["existing", "This person already has a login", "Just add them to the admin list."]] as const).map(([v, t, h]) => (
              <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => setMode(v)} className={`min-h-12 rounded-2xl border-2 p-3 text-left ${mode === v ? "border-accent bg-accent/5" : "border-warm-gray"}`}>
                <span className="block text-base font-semibold">{t}</span>
                <span className="block text-sm text-secondary-text">{h}</span>
              </button>
            ))}
          </div>
          {mode === "new" && (
            <div>
              <label className="block text-base font-medium">Temporary password
                <span className="relative mt-1 block">
                  <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={10} autoComplete="new-password" className={`${input} pr-14`} />
                  <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-secondary-text">
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => { setPassword(randomPassword()); setShow(true); }} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream">Generate</button>
                <span className="text-sm text-secondary-text">At least 10 characters.</span>
              </div>
            </div>
          )}
        </form>
      </SidePanel>
    </div>
  );
}
