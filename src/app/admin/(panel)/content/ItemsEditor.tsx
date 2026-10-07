"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Camera, Loader2, Plus, Star } from "lucide-react";
import { adminApi } from "../../api";
import { SidePanel, useUi } from "../../ui";
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
  /** Words for the banner while the built-in list is shown: "reviews", "questions". */
  plural?: string;
}

export default function ItemsEditor({ kind, noun, fields, empty, title, sub, intro, plural = "items" }: Props) {
  const { toast, confirm } = useUi();
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
      toast({ text: "Copied. You can now edit, hide, reorder or delete each one." });
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
      toast({ text: "Saved and published. It is live on the website now." });
      await load();
    } catch (e) {
      flash("error", (e as Error).message);
    }
    setSaving(false);
  }

  async function toggle(i: Item, withUndo = true) {
    setItems((all) => all && all.map((x) => (x.id === i.id ? { ...x, active: !i.active } : x)));
    try {
      await send(`/api/admin/content/${kind}/${i.id}`, "PUT", { ...i, active: !i.active });
      if (withUndo) toast({ text: `The ${noun} is now ${i.active ? "hidden from" : "visible on"} the website.`, undo: () => toggle({ ...i, active: !i.active }, false) });
    } catch (e) {
      setItems((all) => all && all.map((x) => (x.id === i.id ? { ...x, active: i.active } : x)));
      toast({ text: (e as Error).message, tone: "error" });
    }
  }

  async function remove(i: Item) {
    const r = await confirm({ title: `Delete this ${noun}?`, body: `“${title(i)}” will be removed from the website. This cannot be undone.`, confirmLabel: "Delete", cancelLabel: "Keep", danger: true, alternative: i.active ? { label: "Hide instead", value: "hide" } : undefined });
    if (r.choice === "hide") return toggle(i);
    if (r.choice !== "confirm") return;
    try {
      await send(`/api/admin/content/${kind}/${i.id}`, "DELETE");
      toast({ text: "Deleted." });
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

  const cls = "flex h-12 w-12 items-center justify-center rounded-full hover:bg-warm-gray disabled:opacity-30";
  return (
    <div className="space-y-4">
      {intro}
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {usingDefaults && items && (
        <Notice tone="warn">
          <p>The website is showing the built-in {plural}. Copy them here to start editing.</p>
          <button type="button" onClick={seed} className="mt-3 block min-h-12 rounded-full bg-primary-text px-6 text-base font-semibold text-white">Copy defaults</button>
        </Notice>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-base text-secondary-text">{items ? `${items.length} ${items.length === 1 ? noun : noun + "s"}` : "Loading…"}</p>
        <button type="button" onClick={() => setDraft({ ...empty })} disabled={usingDefaults} className="btn-primary min-h-12 !px-6 !text-base disabled:opacity-50">
          <Plus size={18} /> Add {noun}
        </button>
      </div>

      <ul className="space-y-2.5">
        {(items ?? []).map((i, idx) => (
          <li key={i.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-3.5 ${i.active ? "border-warm-gray" : "border-dashed border-warm-gray opacity-80"}`}>
            <div className="min-w-0 flex-1 basis-48">
              <p className="truncate text-base font-semibold">{title(i)}</p>
              <p className="mt-0.5 line-clamp-2 text-base text-secondary-text">{sub(i)}</p>
              {!i.active && <p className="mt-1 text-sm font-medium text-amber-700">Hidden from the website</p>}
            </div>
            {!usingDefaults && (
              <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-1">
                <button type="button" aria-label="Move up" disabled={idx === 0} onClick={() => move(idx, -1)} className={cls}><ArrowUp size={18} /></button>
                <button type="button" aria-label="Move down" disabled={idx === (items?.length ?? 0) - 1} onClick={() => move(idx, 1)} className={cls}><ArrowDown size={18} /></button>
                <button type="button" role="switch" aria-checked={i.active} onClick={() => toggle(i)} className="flex min-h-12 items-center gap-2 rounded-full px-2 text-base">
                  <span className={`relative h-7 w-12 rounded-full transition-colors ${i.active ? "bg-success" : "bg-gray-300"}`} aria-hidden="true"><span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${i.active ? "left-[1.375rem]" : "left-0.5"}`} /></span>
                  Visible
                </button>
                <button type="button" onClick={() => setDraft({ ...i })} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium hover:bg-cream">Edit</button>
                <button type="button" onClick={() => remove(i)} className="min-h-12 rounded-full border border-red-200 px-5 text-base font-medium text-red-600 hover:bg-red-50">Delete</button>
              </div>
            )}
          </li>
        ))}
        {items?.length === 0 && <li className="rounded-2xl border border-dashed border-warm-gray p-8 text-center text-base text-secondary-text">No {noun}s yet. Add the first one.</li>}
      </ul>

      <SidePanel
        open={!!draft}
        onClose={() => setDraft(null)}
        title={`${draft?.id ? "Edit" : "Add"} ${noun}`}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setDraft(null)} className="min-h-12 rounded-full border border-warm-gray px-6 text-base font-medium hover:bg-cream">Cancel</button>
            <button type="button" onClick={save} disabled={saving || uploading} className="btn-primary ml-auto min-h-12 !px-8 !text-base disabled:opacity-60">{saving ? "Saving…" : "Save and publish"}</button>
          </div>
        }
      >
        {draft && (
          <div className="space-y-4">
            {fields.map((f) => (
              <Field key={f.key} label={f.label} optional={f.optional} hint={f.type === "textarea" && f.max ? `${String(draft[f.key] ?? "").length} / ${f.max}` : f.hint}>
                {f.type === "textarea" ? (
                  <textarea rows={5} maxLength={f.max} value={String(draft[f.key] ?? "")} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} className={fieldCls} />
                ) : f.type === "rating" ? (
                  <span className="flex gap-1" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" role="radio" aria-checked={Number(draft[f.key]) === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setDraft({ ...draft, [f.key]: n })} className="flex h-12 w-12 items-center justify-center">
                        <Star size={28} className={n <= Number(draft[f.key]) ? "fill-amber-400 text-amber-400" : "text-warm-gray"} />
                      </button>
                    ))}
                  </span>
                ) : f.type === "image" ? (
                  <span className="flex items-center gap-3">
                    <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-warm-gray text-secondary-text">
                      {draft[f.key] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={String(draft[f.key])} alt="" className="h-full w-full object-cover" /> : uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                    </span>
                    <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const x = e.target.files?.[0]; if (x) upload(x, f.key); e.target.value = ""; }} />
                    <button type="button" onClick={() => file.current?.click()} disabled={uploading} className="min-h-12 rounded-full border border-warm-gray px-5 text-base font-medium">{draft[f.key] ? "Change photo" : "Upload photo"}</button>
                    {Boolean(draft[f.key]) && <button type="button" onClick={() => setDraft({ ...draft, [f.key]: "" })} className="min-h-12 px-2 text-base text-secondary-text underline">Remove</button>}
                  </span>
                ) : (
                  <input value={String(draft[f.key] ?? "")} maxLength={f.max} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} className={fieldCls} />
                )}
              </Field>
            ))}
            <Switch checked={draft.active !== false} onChange={(v) => setDraft({ ...draft, active: v })} title="Show on the website" hint="Turn off to hide it without deleting." />
          </div>
        )}
      </SidePanel>
    </div>
  );
}
