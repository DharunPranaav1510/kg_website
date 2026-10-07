"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bold, ExternalLink, Heading2, History, Link2, List } from "lucide-react";
import Markdown from "@/components/Markdown";
import { POLICY_SLUGS, POLICY_VARIABLES, type PolicySlug } from "@/data/policy-defaults";
import { fillVars, policyVariables, type Business } from "@/lib/content-schema";
import { adminApi } from "../../api";
import { MoreMenu, SidePanel, useUi } from "../../ui";
import { Field, Notice, fieldCls, useFlash } from "./ui";

interface ListRow { slug: PolicySlug; title: string; updatedAt: string | null }
interface Revision { id: number; title: string; subtitle: string; body: string; saved_at: string; saved_by: string }
interface Doc { title: string; subtitle: string; body: string }

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "Built-in text, not edited yet";

export default function PoliciesEditor() {
  const { toast, confirm } = useUi();
  const [previewRev, setPreviewRev] = useState<Revision | null>(null);
  const [list, setList] = useState<ListRow[]>([]);
  const [slug, setSlug] = useState<PolicySlug>(POLICY_SLUGS[0]);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [saved, setSaved] = useState<Doc | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [showHistory, setShowHistory] = useState(false);
  const { msg, flash, clear } = useFlash();
  const area = useRef<HTMLTextAreaElement>(null);

  const loadList = useCallback(async () => {
    try {
      setList((await adminApi("/api/admin/policies")).policies);
    } catch (e) {
      flash("error", (e as Error).message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOne = useCallback(async (s: PolicySlug) => {
    setDoc(null);
    try {
      const data = await adminApi(`/api/admin/policies/${s}`);
      const d = { title: data.policy.title, subtitle: data.policy.subtitle, body: data.policy.body };
      setDoc(d);
      setSaved(d);
      setUpdatedAt(data.policy.updatedAt);
      setRevisions(data.revisions);
    } catch (e) {
      flash("error", (e as Error).message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadList();
    adminApi("/api/admin/business").then((d) => setBusiness(d.business)).catch(() => {});
  }, [loadList]);
  useEffect(() => {
    loadOne(slug);
  }, [slug, loadOne]);

  const dirty = !!doc && !!saved && (doc.title !== saved.title || doc.subtitle !== saved.subtitle || doc.body !== saved.body);

  async function pick(s: PolicySlug) {
    if (s === slug) return;
    if (dirty) {
      const r = await confirm({ title: "Leave without saving?", body: "Your changes to this policy will be lost.", confirmLabel: "Leave", cancelLabel: "Keep editing" });
      if (r.choice !== "confirm") return;
    }
    clear();
    setSlug(s);
  }

  function insert(before: string, after = "", fallback = "") {
    const el = area.current;
    if (!el || !doc) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const chosen = value.slice(a, b) || fallback;
    const next = value.slice(0, a) + before + chosen + after + value.slice(b);
    setDoc({ ...doc, body: next });
    requestAnimationFrame(() => {
      el.focus();
      const pos = a + before.length + chosen.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function save() {
    if (!doc) return;
    setSaving(true);
    clear();
    try {
      await adminApi(`/api/admin/policies/${slug}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(doc) });
      toast({ text: "Saved and published. The policy page now shows this text." });
      await Promise.all([loadList(), loadOne(slug)]);
    } catch (e) {
      flash("error", (e as Error).message);
    }
    setSaving(false);
  }

  async function reset() {
    const r = await confirm({ title: "Reset to the built-in text?", body: "Your edited text stays in the versions list, so you can restore it later.", confirmLabel: "Reset to built-in text", cancelLabel: "Keep my text", danger: true });
    if (r.choice !== "confirm") return;
    try {
      await adminApi(`/api/admin/policies/${slug}`, { method: "DELETE" });
      toast({ text: "Back to the built-in text." });
      await Promise.all([loadList(), loadOne(slug)]);
    } catch (e) {
      flash("error", (e as Error).message);
    }
  }

  const preview = useMemo(
    () => (doc && business ? fillVars(doc.body, policyVariables(business)) : doc?.body ?? ""),
    [doc, business]
  );

  return (
    <div className="space-y-4">
      <Notice>
        These pages are shown to customers before they order, and a customer ticks a box agreeing to them at checkout. Each order records which version they
        agreed to. Have a lawyer or CA read the final text. Use <b>{"{{placeholders}}"}</b> (chips below) for phone, fees and so on, and they stay correct
        when you change your business details.
      </Notice>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <nav aria-label="Policy pages">
        <select value={slug} onChange={(e) => pick(e.target.value as PolicySlug)} aria-label="Policy" className={`${fieldCls} lg:hidden`}>
          {POLICY_SLUGS.map((s) => <option key={s} value={s}>{list.find((r) => r.slug === s)?.title ?? s}</option>)}
        </select>
        <ul className="hidden space-y-1 lg:block" role="tablist" aria-label="Policy pages">
          {POLICY_SLUGS.map((s) => {
            const row = list.find((r) => r.slug === s);
            return (
              <li key={s}>
                <button role="tab" aria-selected={s === slug} onClick={() => pick(s)} className={`min-h-12 w-full rounded-xl border px-3 py-2 text-left ${s === slug ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white hover:bg-cream"}`}>
                  <span className="block text-base font-medium">{row?.title ?? s}</span>
                  <span className={`block text-sm ${s === slug ? "text-white/80" : "text-secondary-text"}`}>{row?.updatedAt ? `Saved ${when(row.updatedAt)}` : "Built-in text"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0">
      {!doc ? (
        <p className="py-10 text-center text-sm text-secondary-text">Loading…</p>
      ) : (
        <div className="space-y-4 rounded-2xl border border-warm-gray bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-secondary-text">
            <span>Last published: <b className="text-primary-text">{when(updatedAt)}</b></span>
            <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">View live page <ExternalLink size={12} /></a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Page title"><input className={fieldCls} value={doc.title} maxLength={100} onChange={(e) => setDoc({ ...doc, title: e.target.value })} /></Field>
            <Field label="Short line under the title" optional><input className={fieldCls} value={doc.subtitle} maxLength={200} onChange={(e) => setDoc({ ...doc, subtitle: e.target.value })} /></Field>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-sm font-medium">Text</span>
              <button type="button" onClick={() => insert("\n## ", "\n", "Heading")} className="flex min-h-12 items-center gap-1.5 rounded-full border border-warm-gray px-4 text-base" title="Heading"><Heading2 size={14} /> Heading</button>
              <button type="button" onClick={() => insert("**", "**", "bold text")} className="flex min-h-12 items-center gap-1.5 rounded-full border border-warm-gray px-4 text-base" title="Bold"><Bold size={14} /> Bold</button>
              <button type="button" onClick={() => insert("\n- ", "", "item")} className="flex min-h-12 items-center gap-1.5 rounded-full border border-warm-gray px-4 text-base" title="Bullet"><List size={14} /> List</button>
              <button type="button" onClick={() => insert("[", "](/delivery)", "link text")} className="flex min-h-12 items-center gap-1.5 rounded-full border border-warm-gray px-4 text-base" title="Link"><Link2 size={14} /> Link</button>
              <span className="ml-auto flex rounded-full border border-warm-gray p-0.5 text-xs lg:hidden">
                {(["edit", "preview"] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setView(v)} className={`min-h-12 rounded-full px-4 ${view === v ? "bg-primary-text text-white" : ""}`}>{v === "edit" ? "Edit" : "Preview"}</button>
                ))}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pb-3">
              {POLICY_VARIABLES.map((v) => (
                <button key={v.name} type="button" title={v.label} onClick={() => insert(`{{${v.name}}}`)} className="rounded-full bg-cream px-2.5 py-1 font-mono text-[11px] text-secondary-text hover:bg-warm-gray">
                  {`{{${v.name}}}`}
                </button>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <textarea
                ref={area}
                value={doc.body}
                onChange={(e) => setDoc({ ...doc, body: e.target.value })}
                rows={22}
                spellCheck
                aria-label="Policy text"
                className={`${fieldCls} font-mono leading-relaxed ${view === "preview" ? "hidden lg:block" : ""}`}
              />
              <div className={`max-h-[34rem] overflow-y-auto rounded-xl border border-warm-gray bg-background p-4 text-sm leading-relaxed text-secondary-text ${view === "edit" ? "hidden lg:block" : ""}`}>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-secondary-text/70">Preview</p>
                <h3 className="mb-1 font-display text-2xl text-primary-text">{doc.title}</h3>
                {doc.subtitle && <p className="mb-4">{doc.subtitle}</p>}
                <Markdown text={preview} />
              </div>
            </div>
            <p className="mt-2 text-xs text-secondary-text">
              Formatting: <code>## Heading</code>, a blank line between paragraphs, <code>- bullet</code>, <code>1. numbered</code>, <code>**bold**</code>, <code>[text](/page)</code>.
            </p>
          </div>

          <div className="sticky bottom-[4.75rem] z-30 flex flex-wrap items-center gap-3 rounded-2xl border border-warm-gray bg-white/95 px-4 py-3 shadow-hover backdrop-blur lg:bottom-4">
            <p className="min-w-[8rem] flex-1 text-base">{dirty ? <b className="text-amber-800">Unsaved changes</b> : "All changes are saved."}</p>
            <button type="button" onClick={() => setShowHistory(true)} className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-warm-gray px-4 text-base font-medium hover:bg-cream"><History size={16} /> Versions ({revisions.length})</button>
            <MoreMenu label="More" items={[{ label: "Reset to built-in text", onSelect: reset, danger: true, hidden: !updatedAt }, { label: "View live page", href: `/${slug}` }]} />
            <button type="button" onClick={() => saved && setDoc(saved)} disabled={!dirty} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream disabled:opacity-50">Discard</button>
            <button type="button" onClick={save} disabled={!dirty || saving} className="btn-primary min-h-12 !px-8 !text-base disabled:opacity-50">{saving ? "Publishing…" : "Save and publish"}</button>
          </div>

          <SidePanel open={showHistory} onClose={() => { setShowHistory(false); setPreviewRev(null); }} title="Versions" subtitle="The 20 most recent saved versions." width="560px">
            {previewRev ? (
              <div>
                <button type="button" onClick={() => setPreviewRev(null)} className="mb-3 min-h-12 text-base font-medium text-accent">← All versions</button>
                <p className="mb-2 text-sm text-secondary-text">{when(previewRev.saved_at)} · {previewRev.saved_by}</p>
                <h3 className="mb-1 font-display text-2xl">{previewRev.title}</h3>
                {previewRev.subtitle && <p className="mb-3 text-secondary-text">{previewRev.subtitle}</p>}
                <div className="rounded-xl border border-warm-gray bg-background p-4 text-base leading-relaxed text-secondary-text"><Markdown text={business ? fillVars(previewRev.body, policyVariables(business)) : previewRev.body} /></div>
                <button type="button" onClick={() => { setDoc({ title: previewRev.title, subtitle: previewRev.subtitle ?? "", body: previewRev.body }); setShowHistory(false); setPreviewRev(null); toast({ text: "Restored into the editor. Save and publish to use it." }); }} className="btn-primary mt-4 min-h-12 w-full !text-base">Restore this version</button>
              </div>
            ) : revisions.length === 0 ? (
              <p className="text-base text-secondary-text">No earlier versions yet.</p>
            ) : (
              <ul className="divide-y divide-warm-gray">
                {revisions.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 py-2 text-base">
                    <span className="flex-1">{when(r.saved_at)}<span className="block text-sm text-secondary-text">{r.saved_by}</span></span>
                    <button type="button" onClick={() => setPreviewRev(r)} className="min-h-12 rounded-full border border-warm-gray px-4 text-base font-medium hover:bg-cream">Preview</button>
                    <button type="button" onClick={() => { setDoc({ title: r.title, subtitle: r.subtitle ?? "", body: r.body }); setShowHistory(false); toast({ text: "Restored into the editor. Save and publish to use it." }); }} className="min-h-12 rounded-full border border-warm-gray px-4 text-base font-medium hover:bg-cream">Restore</button>
                  </li>
                ))}
              </ul>
            )}
          </SidePanel>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
