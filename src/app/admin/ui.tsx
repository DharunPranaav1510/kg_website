"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

// ---------------------------------------------------------------------------
// Shared admin interface pieces: toasts with Undo, a named confirmation, and a
// side panel (right side on desktop, full screen on phones).
// ---------------------------------------------------------------------------

export const SHOP_CHANGED_EVENT = "kg-shop-changed";

interface ToastOptions {
  text: string;
  /** "error" toasts stay a little longer and are red. */
  tone?: "ok" | "error";
  undo?: () => void | Promise<void>;
  retry?: () => void | Promise<void>;
  /** Link-like action, e.g. "View". */
  action?: { label: string; href: string };
  ms?: number;
}
interface ToastItem extends ToastOptions {
  id: number;
}

interface ConfirmOptions {
  title: string;
  body?: string;
  /** Button text repeats the verb: "Cancel order", "Delete". */
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  /** An extra safer choice, e.g. "Hide from shop instead". */
  alternative?: { label: string; value: string };
  /** Ask for a short text as well, e.g. the reason for blocking a number. */
  input?: { label: string; placeholder?: string; required?: boolean };
}
export interface ConfirmResult {
  /** "confirm", "cancel", or the alternative's value. */
  choice: string;
  value: string;
}

interface Ui {
  toast: (t: ToastOptions) => void;
  confirm: (o: ConfirmOptions) => Promise<ConfirmResult>;
}
const UiContext = createContext<Ui | null>(null);

export function useUi(): Ui {
  const ui = useContext(UiContext);
  if (!ui) throw new Error("useUi must be used inside the admin shell");
  return ui;
}

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [ask, setAsk] = useState<{ o: ConfirmOptions; done: (r: ConfirmResult) => void } | null>(null);
  const [typed, setTyped] = useState("");
  const next = useRef(1);

  const toast = useCallback((t: ToastOptions) => {
    const id = next.current++;
    // One at a time: a new toast replaces the old one.
    setToasts([{ ...t, id }]);
    const ms = t.ms ?? (t.tone === "error" ? 9000 : t.undo ? 7000 : 5000);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), ms);
  }, []);

  const confirm = useCallback(
    (o: ConfirmOptions) =>
      new Promise<ConfirmResult>((done) => {
        setTyped("");
        setAsk({ o, done });
      }),
    []
  );
  const finish = (choice: string) => {
    ask?.done({ choice, value: typed.trim() });
    setAsk(null);
  };

  useEffect(() => {
    if (!ask) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish("cancel");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask]);

  return (
    <UiContext.Provider value={{ toast, confirm }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-[4.75rem] z-[70] flex justify-center px-4 lg:bottom-6" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-base text-white shadow-hover ${t.tone === "error" ? "bg-red-700" : "bg-primary-text"}`}
          >
            <span className="flex-1">{t.text}</span>
            {t.undo && (
              <button
                onClick={async () => {
                  setToasts([]);
                  await t.undo?.();
                }}
                className="min-h-12 rounded-lg px-3 font-semibold text-amber-300"
              >
                Undo
              </button>
            )}
            {t.retry && (
              <button
                onClick={async () => {
                  setToasts([]);
                  await t.retry?.();
                }}
                className="min-h-12 rounded-lg px-3 font-semibold text-amber-300"
              >
                Retry
              </button>
            )}
            {t.action && (
              <a href={t.action.href} onClick={() => setToasts([])} className="flex min-h-12 items-center rounded-lg px-3 font-semibold text-amber-300">
                {t.action.label}
              </a>
            )}
          </div>
        ))}
      </div>

      {ask && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center" onClick={() => finish("cancel")}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="ui-confirm-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-hover">
            <h2 id="ui-confirm-title" className="font-display text-xl">{ask.o.title}</h2>
            {ask.o.body && <p className="mt-2 text-base text-secondary-text">{ask.o.body}</p>}
            {ask.o.input && (
              <label className="mt-4 block text-sm font-medium">
                {ask.o.input.label}
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={ask.o.input.placeholder}
                  maxLength={200}
                  className="mt-1 min-h-12 w-full rounded-xl border border-warm-gray px-3 text-base outline-none focus:border-accent"
                />
              </label>
            )}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                autoFocus={!ask.o.input}
                disabled={!!ask.o.input?.required && !typed.trim()}
                onClick={() => finish("confirm")}
                className={`min-h-12 rounded-full px-6 text-base font-semibold text-white disabled:opacity-50 ${ask.o.danger ? "bg-red-600 hover:bg-red-700" : "bg-accent hover:bg-accent-light"}`}
              >
                {ask.o.confirmLabel}
              </button>
              {ask.o.alternative && (
                <button onClick={() => finish(ask.o.alternative!.value)} className="min-h-12 rounded-full border border-warm-gray px-6 text-base font-medium hover:bg-cream">
                  {ask.o.alternative.label}
                </button>
              )}
              <button onClick={() => finish("cancel")} className="min-h-12 rounded-full border border-warm-gray px-6 text-base font-medium hover:bg-cream">
                {ask.o.cancelLabel ?? "Keep"}
              </button>
            </div>
          </div>
        </div>
      )}
    </UiContext.Provider>
  );
}

/** Panel from the right on desktop, full screen on phones. Escape closes it. */
export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  width = "480px",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  width?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
      <div className="absolute inset-0 hidden bg-black/40 sm:block" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-hover sm:w-[var(--panel-w)]" style={{ ["--panel-w" as string]: width }}>
        <header className="flex items-start gap-3 border-b border-warm-gray px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl">{title}</h2>
            {subtitle && <div className="text-sm text-secondary-text">{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-2 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full hover:bg-warm-gray">
            <X size={22} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
        {footer && <footer className="border-t border-warm-gray bg-white px-4 py-3 sm:px-6">{footer}</footer>}
      </div>
    </div>
  );
}

/** Small "⋯ More" menu used for rare or destructive actions. */
export function MoreMenu({
  label = "More",
  items,
  align = "right",
}: {
  label?: string;
  items: { label: string; onSelect?: () => void; href?: string; danger?: boolean; hidden?: boolean }[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const shown = items.filter((i) => !i.hidden);
  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className="min-h-12 rounded-full border border-warm-gray bg-white px-4 text-base font-medium hover:bg-cream">
        {label} ▾
      </button>
      {open && (
        <ul role="menu" className={`absolute z-40 mt-1 w-60 overflow-hidden rounded-xl border border-warm-gray bg-white py-1 shadow-hover ${align === "right" ? "right-0" : "left-0"}`}>
          {shown.map((i) => {
            const cls = `flex min-h-12 w-full items-center px-4 text-left text-base hover:bg-cream ${i.danger ? "text-red-600" : ""}`;
            return (
              <li key={i.label} role="none">
                {i.href ? (
                  <a role="menuitem" href={i.href} target="_blank" rel="noopener" className={cls} onClick={() => setOpen(false)}>{i.label}</a>
                ) : (
                  <button role="menuitem" className={cls} onClick={() => { setOpen(false); i.onSelect?.(); }}>{i.label}</button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Format helpers shared by the admin screens. */
export const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).replace(/\bam\b/, "AM").replace(/\bpm\b/, "PM");
export const dayDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

// ---------------------------------------------------------------------------
// Drafts kept on this device, so an expired session or a stray tap never loses typing.
// ---------------------------------------------------------------------------
const DRAFT_PREFIX = "kg-admin-draft:";
interface StoredDraft<T> {
  at: number;
  value: T;
}
export function readDraft<T>(key: string): StoredDraft<T> | null {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + key);
    return raw ? (JSON.parse(raw) as StoredDraft<T>) : null;
  } catch {
    return null;
  }
}
export function clearDraft(key: string) {
  try {
    localStorage.removeItem(DRAFT_PREFIX + key);
  } catch {
    /* ignore */
  }
}

/**
 * Saves `value` to this device every few seconds while it differs from `initial`.
 * Returns the draft found when the form opened (to offer "Restore") and a way to drop it.
 */
export function useDraftBackup<T>(key: string, value: T, initial: T) {
  const [found, setFound] = useState<StoredDraft<T> | null>(null);
  const latest = useRef(value);
  latest.current = value;
  const initialJson = useRef(JSON.stringify(initial));

  useEffect(() => {
    const d = readDraft<T>(key);
    setFound(d && JSON.stringify(d.value) !== initialJson.current ? d : null);
  }, [key]);

  useEffect(() => {
    const id = setInterval(() => {
      try {
        if (JSON.stringify(latest.current) === initialJson.current) return;
        localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify({ at: Date.now(), value: latest.current }));
      } catch {
        /* storage full or blocked: skip */
      }
    }, 3000);
    return () => clearInterval(id);
  }, [key]);

  const dirty = JSON.stringify(value) !== initialJson.current;
  return {
    found,
    dirty,
    dismiss: () => setFound(null),
    discard: () => {
      clearDraft(key);
      setFound(null);
    },
  };
}
