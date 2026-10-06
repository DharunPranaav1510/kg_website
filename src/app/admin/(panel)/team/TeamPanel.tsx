"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, RefreshCw, Trash2, UserPlus, X } from "lucide-react";
import { adminApi } from "../../api";

interface AdminRow { email: string; added_by: string | null; added_at: string | null; you: boolean }
interface InviteRow { id: string; email: string; invited_by: string; created_at: string; expires_at: string; status: "waiting" | "code_sent" | "expired" | "accepted" | "revoked" }

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "";

const STATUS: Record<InviteRow["status"], { text: string; cls: string }> = {
  waiting: { text: "Waiting for them to open it", cls: "bg-amber-100 text-amber-800" },
  code_sent: { text: "They asked for the code", cls: "bg-sky-100 text-sky-800" },
  expired: { text: "Expired", cls: "bg-warm-gray text-secondary-text" },
  accepted: { text: "Joined", cls: "bg-success/10 text-success" },
  revoked: { text: "Cancelled", cls: "bg-warm-gray text-secondary-text" },
};

export default function TeamPanel() {
  const [admins, setAdmins] = useState<AdminRow[] | null>(null);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [emailReady, setEmailReady] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [devLink, setDevLink] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await adminApi("/api/admin/team");
      setAdmins(d.admins);
      setInvites(d.invites);
      setEmailReady(d.emailReady);
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
      setAdmins((a) => a ?? []);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const json = { "Content-Type": "application/json" };

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setDevLink("");
    try {
      const d = await adminApi("/api/admin/team/invite", { method: "POST", headers: json, body: JSON.stringify({ email }) });
      setMsg({ tone: "ok", text: `Invitation sent to ${email.trim()}. The link works for 48 hours.` });
      if (d.devLink) setDevLink(d.devLink);
      setEmail("");
      await load();
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message });
    }
    setBusy(false);
  }

  async function resend(i: InviteRow) {
    setBusy(true);
    setMsg(null);
    try {
      const d = await adminApi(`/api/admin/team/invite/${i.id}`, { method: "POST" });
      setMsg({ tone: "ok", text: `A new invitation was sent to ${i.email}. The earlier link no longer works.` });
      setDevLink(d.devLink ?? "");
      await load();
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message });
    }
    setBusy(false);
  }

  async function cancel(i: InviteRow) {
    if (!window.confirm(`Cancel the invitation for ${i.email}? Their link will stop working.`)) return;
    try {
      await adminApi(`/api/admin/team/invite/${i.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message });
    }
  }

  async function remove(a: AdminRow) {
    if (!window.confirm(`Remove ${a.email}? They lose access straight away and their login is deleted.`)) return;
    try {
      await adminApi(`/api/admin/team/admins?email=${encodeURIComponent(a.email)}`, { method: "DELETE" });
      setMsg({ tone: "ok", text: `${a.email} was removed.` });
      await load();
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message });
    }
  }

  const pending = invites.filter((i) => i.status === "waiting" || i.status === "code_sent");
  const past = invites.filter((i) => !(i.status === "waiting" || i.status === "code_sent")).slice(0, 8);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">Admins</h1>
        <p className="text-sm text-secondary-text">Everyone here can manage orders, products, prices, content and other admins. Only invite people you trust.</p>
      </div>

      {msg && <p role={msg.tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${msg.tone === "ok" ? "bg-success/10 text-success" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      {devLink && <p className="break-all rounded-xl bg-sky-50 px-4 py-3 text-xs text-sky-900">Test mode (no email key): open <a className="underline" href={devLink}>{devLink}</a></p>}
      {!emailReady && <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Email is not set up, so invitations cannot be sent yet. Add <b>RESEND_API_KEY</b> and <b>RESEND_FROM</b> in Vercel and redeploy.</p>}

      <form onSubmit={invite} className="rounded-2xl border border-warm-gray bg-white p-4 sm:p-5">
        <h2 className="mb-1 flex items-center gap-2 font-medium"><UserPlus size={18} className="text-accent" /> Invite a new admin</h2>
        <p className="mb-3 text-xs text-secondary-text">We email them a link. On the page they confirm their email with a 6-digit code and choose their own password.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="their.email@example.com" autoComplete="off" className="min-h-12 flex-1 rounded-xl border border-warm-gray px-4 text-base outline-none focus:border-accent" />
          <button type="submit" disabled={busy || !email.trim()} className="btn-primary min-h-12 !px-7 disabled:opacity-60"><Mail size={16} /> Send invitation</button>
        </div>
      </form>

      {pending.length > 0 && (
        <section className="rounded-2xl border border-warm-gray bg-white p-4 sm:p-5">
          <h2 className="mb-2 font-medium">Waiting to join ({pending.length})</h2>
          <ul className="divide-y divide-warm-gray/70">
            {pending.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{i.email}</b>
                  <span className="block text-xs text-secondary-text">Invited by {i.invited_by} · {when(i.created_at)} · expires {when(i.expires_at)}</span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS[i.status].cls}`}>{STATUS[i.status].text}</span>
                <button type="button" onClick={() => resend(i)} disabled={busy} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"><RefreshCw size={14} /> Resend</button>
                <button type="button" onClick={() => cancel(i)} className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"><X size={14} /> Cancel</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-warm-gray bg-white p-4 sm:p-5">
        <h2 className="mb-2 font-medium">Current admins ({admins?.length ?? 0})</h2>
        {admins === null ? (
          <p className="py-4 text-sm text-secondary-text">Loading…</p>
        ) : (
          <ul className="divide-y divide-warm-gray/70">
            {admins.map((a) => (
              <li key={a.email} className="flex flex-wrap items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{a.email} {a.you && <span className="ml-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">You</span>}</b>
                  <span className="block text-xs text-secondary-text">{a.added_by ? `Invited by ${a.added_by} · ${when(a.added_at)}` : "Original admin"}</span>
                </span>
                {!a.you && admins.length > 1 && (
                  <button type="button" onClick={() => remove(a)} className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"><Trash2 size={14} /> Remove</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="rounded-2xl border border-warm-gray bg-white p-4 text-sm sm:p-5">
          <h2 className="mb-2 font-medium">Earlier invitations</h2>
          <ul className="space-y-1.5 text-xs text-secondary-text">
            {past.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3">
                <span className="truncate">{i.email} · {when(i.created_at)}</span>
                <span className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS[i.status].cls}`}>{STATUS[i.status].text}</span>
                  {(i.status === "expired" || i.status === "revoked") && <button type="button" onClick={() => resend(i)} className="font-medium text-accent hover:underline">Invite again</button>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
