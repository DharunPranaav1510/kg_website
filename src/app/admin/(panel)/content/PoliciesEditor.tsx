"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bold, ExternalLink, Heading2, History, Link2, List, RotateCcw } from "lucide-react";
import Markdown from "@/components/Markdown";
import { POLICY_SLUGS, POLICY_VARIABLES, type PolicySlug } from "@/data/policy-defaults";
import { fillVars, policyVariables, type Business } from "@/lib/content-schema";
import { adminApi } from "../../api";
import { Field, Notice, fieldCls, useFlash } from "./ui";

interface ListRow { slug: PolicySlug; title: string; updatedAt: string | null }
interface Revision { id: number; title: string; subtitle: string; body: string; saved_at: string; saved_by: string }
interface Doc { title: string; subtitle: string; body: string }

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "Built-in text, not edited yet";

export default function PoliciesEditor() {
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

  function pick(s: PolicySlug) {
    if (s === slug) return;
    if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) return;
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
    if (!window.confirm("Publish this? Customers will see the new text straight away and the 'last updated' date changes.")) return;
    setSaving(true);
    clear();
    try {
      await adminApi(`/api/admin/policies/${slug}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(doc) });
      flash("ok", "Published. The policy page now shows this text.");
      await Promise.all([loadList(), loadOne(slug)]);
    } catch (e) {
      flash("error", (e as Error).message);
    }
    setSaving(false);
  }

  async function reset() {
    if (!window.confirm("Go back to the built-in text? Your edited text stays in the history so you can load it again.")) return;
    try {
      await adminApi(`/api/admin/policies/${slug}`, { method: "DELETE" });
      flash("ok", "Back to the built-in text.");
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

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Policy pages">
        {POLICY_SLUGS.map((s) => {
          const row = list.find((r) => r.slug === s);
          return (
            <button key={s} role="tab" aria-selected={s === slug} onClick={() => pick(s)} className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${s === slug ? "border-primary-text bg-primary-text text-white" : "border-warm-gray bg-white"}`}>
              {row?.title ?? s}
            </button>
          );
        })}
      </div>

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
              <button type="button" onClick={() => insert("\n## ", "\n", "Heading")} className="flex h-10 items-center gap-1.5 rounded-full border border-warm-gray px-3 text-xs" title="Heading"><Heading2 size={14} /> Heading</button>
              <button type="button" onClick={() => insert("**", "**", "bold text")} className="flex h-10 items-center gap-1.5 rounded-full border border-warm-gray px-3 text-xs" title="Bold"><Bold size={14} /> Bold</button>
              <button type="button" onClick={() => insert("\n- ", "", "item")} className="flex h-10 items-center gap-1.5 rounded-full border border-warm-gray px-3 text-xs" title="Bullet"><List size={14} /> List</button>
              <button type="button" onClick={() => insert("[", "](/delivery)", "link text")} className="flex h-10 items-center gap-1.5 rounded-full border border-warm-gray px-3 text-xs" title="Link"><Link2 size={14} /> Link</button>
              <span className="ml-auto flex rounded-full border border-warm-gray p-0.5 text-xs lg:hidden">
                {(["edit", "preview"] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setView(v)} className={`rounded-full px-3 py-1.5 ${view === v ? "bg-primary-text text-white" : ""}`}>{v === "edit" ? "Edit" : "Preview"}</button>
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

          <div className="flex flex-wrap items-center gap-3 border-t border-warm-gray pt-4">
            <button type="button" onClick={save} disabled={!dirty || saving} className="btn-primary !px-8 !py-3 disabled:opacity-50">{saving ? "Publishing…" : "Publish changes"}</button>
            {dirty && <span className="text-sm font-medium text-amber-700">Unsaved changes</span>}
            <button type="button" onClick={() => setShowHistory((v) => !v)} className="ml-auto inline-flex items-center gap-1.5 text-sm text-secondary-text hover:text-accent"><History size={15} /> History ({revisions.length})</button>
            {updatedAt && <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm text-secondary-text hover:text-accent"><RotateCcw size={15} /> Use built-in text</button>}
          </div>

          {showHistory && (
            <ul className="divide-y divide-warm-gray overflow-hidden rounded-xl border border-warm-gray text-sm">
              {revisions.length === 0 && <li className="p-4 text-secondary-text">No earlier versions yet.</li>}
              {revisions.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 p-3.5">
                  <span>{when(r.saved_at)} <span className="text-secondary-text">· {r.saved_by}</span></span>
                  <button type="button" onClick={() => { setDoc({ title: r.title, subtitle: r.subtitle ?? "", body: r.body }); setShowHistory(false); flash("ok", "Loaded into the editor. Publish to use it."); }} className="rounded-full border border-warm-gray px-3.5 py-1.5 text-xs font-medium">Load</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
