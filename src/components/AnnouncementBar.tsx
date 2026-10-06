"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";

const KEY = "kg-announcement-dismissed";

/** A one-line notice set from the admin panel (festival timings, offers ...). Can be closed for the visit. */
export default function AnnouncementBar({ className = "" }: { className?: string }) {
  const { text, link, enabled } = useBusiness().announcement;
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(window.sessionStorage.getItem(KEY) === text);
    } catch {
      setHidden(false);
    }
  }, [text]);

  if (!enabled || !text || hidden) return null;
  const body = (
    <span className="flex min-w-0 items-center gap-2">
      <Megaphone size={14} className="flex-shrink-0 text-amber-300" />
      <span className="min-w-0 truncate sm:whitespace-normal">{text}</span>
    </span>
  );
  return (
    <div role="status" className={`flex items-center justify-center gap-2 bg-primary-text px-4 py-2 text-xs text-white sm:text-sm ${className}`}>
      {link ? (
        link.startsWith("/") ? (
          <Link href={link} className="min-w-0 underline-offset-4 hover:underline">{body}</Link>
        ) : (
          <a href={link} className="min-w-0 underline-offset-4 hover:underline" {...(link.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{body}</a>
        )
      ) : (
        body
      )}
      <button
        type="button"
        aria-label="Close notice"
        onClick={() => {
          try { window.sessionStorage.setItem(KEY, text); } catch { /* ignore */ }
          setHidden(true);
        }}
        className="-mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white/70 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}
