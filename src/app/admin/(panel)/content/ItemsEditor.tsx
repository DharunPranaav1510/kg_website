"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Camera, Eye, EyeOff, Loader2, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { adminApi } from "../../api";
import { Field, Notice, Switch, fieldCls, useFlash } from "./ui";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "rating" | "image";
  max?: number;
  optional?: boolean;
  placeholder?: string;
  hint?: string;
}

type Item = Record<string, unknown> & { id: string; active: boolean };

interface Props {
  kind: "testimonials" | "faqs";
  noun: string;
  fields: FieldDef[];
  empty: Record<string, unknown>;
  title: (i: Item) => string;
  sub: (i: Item) => string;
  defaultsNotice: React.ReactNode;
  intro?: React.ReactNode;
}

export default function ItemsEditor({ kind, noun, fields, empty, title, sub, defaultsNotice, intro }: Props) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [usingDefaults, setUsingDefaults] = useState(false);
  const [draft, setDraft] = useState<(Record<string, unknown> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { msg, flash, clear } = useFlash();
  const file = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminApi(`/api/admin/content/${kind}`);
      setItems(data.items);
      setUsingDefaults(data.usingDefaults);
    } catch (e) {
      flash("error", (e as Error).message);
      setItems((i) => i ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);
  useEffect(() => {
    load();
  }, [load]);

  const send = (url: string, method: string, body?: unknown) =>
    adminApi(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

  async function seed() {
    try {
      await send(`/api/admin/content/${kind}`, "POST", { seed: true });
      flash("ok", "Copied. You can now edit, hide, reorder or delete each one.");
      await load();
    } catch (e) {
      flash("error", (e as Error).message);
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    clear();
    try {
      await (draft.id ? send(`/api/admin/content/${kind}/${draft.id}`, "PUT", draft) : send(`/api/admin/content/${kind}`, "POST", draft));
      setDraft(null);
      flash("ok", "Saved. It is live on the website now.");
      await load();
    } catch (e) {
      flash("error", (e as Error).message);
    }
    setSaving(false);
  }

  async function toggle(i: Item) {
    try {
      await send(`/api/admin/content/${kind}/${i.id}`, "PUT", { ...i, active: !i.active });
      await load();
    } catch (e) {
      flash("error", (e as Error).message);
    }
  }

  async function remove(i: Item) {
    if (!window.confirm(`Delete this ${noun}? This cannot be undone.`)) return;
    try {
      await send(`/api/admin/content/${kind}/${i.id}`, "DELETE");
      flash("ok", "Deleted.");
      await load();
    } catch (e) {
      flash("error", (e as Error).message);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    if (!items) return;
    const next = [...items];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    setItems(next);
    try {
      await send(`/api/admin/content/${kind}`, "PUT", { order: next.map((i) => i.id) });
    } catch (e) {
      flash("error", (e as Error).message);
      await load();
    }
  }

  async function upload(f: File, key: string) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const { url } = await adminApi("/api/admin/upload", { method: "POST", body: form });
      setDraft((d) => (d ? { ...d, [key]: url } : d));
    } catch (e) {
      flash("error", (e as Error).message);
    }
    setUploading(false);
  }

  return (
    <div className="space-y-4">
      {intro}
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {usingDefaults && items && (
        <Notice tone="warn">
          {defaultsNotice}
          <button type="button" onClick={seed} className="mt-3 block rounded-full bg-primary-text px-5 py-2.5 text-sm font-semibold text-white">
            Copy these into the database so I can edit them
          </button>
        </Notice>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary-text">{items ? `${items.length} ${items.length === 1 ? noun : noun + "s"}` : "Loading…"}</p>
        <button type="button" onClick={() => setDraft({ ...empty })} disabled={usingDefaults} className="btn-primary !px-5 !py-2.5 disabled:opacity-50">
          <Plus size={16} /> Add {noun}
        </button>
      </div>

      <ul className="space-y-2.5">
        {(items ?? []).map((i, idx) => (
          <li key={i.id} className={`flex gap-3 rounded-2xl border bg-white p-3.5 ${i.active ? "border-warm-gray" : "border-dashed border-warm-gray opacity-70"}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{title(i)}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-secondary-text">{sub(i)}</p>
              {!i.active && <p className="mt-1 text-xs font-medium text-amber-700">Hidden from the website</p>}
            </div>
            {!usingDefaults && (
              <div className="flex flex-shrink-0 flex-wrap items-start justify-end gap-1">
                <button type="button" aria-label="Move up" disabled={idx === 0} onClick={() => move(idx, -1)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-warm-gray disabled:opacity-30"><ArrowUp size={16} /></button>
                <button type="button" aria-label="Move down" disabled={idx === (items?.length ?? 0) - 1} onClick={() => move(idx, 1)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-warm-gray disabled:opacity-30"><ArrowDown size={16} /></button>
                <button type="button" aria-label={i.active ? "Hide" : "Show"} title={i.active ? "Hide from website" : "Show on website"} onClick={() => toggle(i)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-warm-gray">{i.active ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                <button type="button" aria-label="Edit" onClick={() => setDraft({ ...i })} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-warm-gray"><Pencil size={16} /></button>
                <button type="button" aria-label="Delete" onClick={() => remove(i)} className="flex h-10 w-10 items-center justify-center rounded-full text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
            )}
          </li>
        ))}
        {items?.length === 0 && <li className="rounded-2xl border border-dashed border-warm-gray p-8 text-center text-sm text-secondary-text">Nothing here yet.</li>}
      </ul>

      {draft && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`${draft.id ? "Edit" : "Add"} ${noun}`}>
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-hover sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">{draft.id ? "Edit" : "Add"} {noun}</h2>
              <button type="button" onClick={() => setDraft(null)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-warm-gray"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {fields.map((f) => (
                <Field key={f.key} label={f.label} optional={f.optional} hint={f.type === "textarea" && f.max ? `${String(draft[f.key] ?? "").length} / ${f.max}` : f.hint}>
                  {f.type === "textarea" ? (
                    <textarea rows={5} maxLength={f.max} value={String(draft[f.key] ?? "")} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} className={fieldCls} />
                  ) : f.type === "rating" ? (
                    <span className="flex gap-1" role="radiogroup" aria-label="Rating">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" role="radio" aria-checked={Number(draft[f.key]) === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setDraft({ ...draft, [f.key]: n })} className="flex h-11 w-11 items-center justify-center">
                          <Star size={26} className={n <= Number(draft[f.key]) ? "fill-amber-400 text-amber-400" : "text-warm-gray"} />
                        </button>
                      ))}
                    </span>
                  ) : f.type === "image" ? (
                    <span className="flex items-center gap-3">
                      <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-warm-gray text-secondary-text">
                        {draft[f.key] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={String(draft[f.key])} alt="" className="h-full w-full object-cover" /> : uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                      </span>
                      <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const x = e.target.files?.[0]; if (x) upload(x, f.key); e.target.value = ""; }} />
                      <button type="button" onClick={() => file.current?.click()} disabled={uploading} className="rounded-full border border-warm-gray px-4 py-2.5 text-sm font-medium">{draft[f.key] ? "Change photo" : "Upload photo"}</button>
                      {Boolean(draft[f.key]) && <button type="button" onClick={() => setDraft({ ...draft, [f.key]: "" })} className="text-sm text-secondary-text underline">Remove</button>}
                    </span>
                  ) : (
                    <input value={String(draft[f.key] ?? "")} maxLength={f.max} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} className={fieldCls} />
                  )}
                </Field>
              ))}
              <Switch checked={draft.active !== false} onChange={(v) => setDraft({ ...draft, active: v })} title="Show on the website" hint="Turn off to hide it without deleting." />
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={save} disabled={saving || uploading} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
              <button type="button" onClick={() => setDraft(null)} className="rounded-full border border-warm-gray px-6 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
