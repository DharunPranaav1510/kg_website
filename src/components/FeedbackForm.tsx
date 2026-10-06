"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const WORDS = ["", "Poor", "Could be better", "Okay", "Good", "Excellent"];

/** Shown on a delivered order. One rating and an optional comment per order. */
export default function FeedbackForm({ orderId, existing }: { orderId: string; existing: { rating: number; comment: string | null } | null }) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [done, setDone] = useState(!!existing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!rating) return setError("Tap the stars to rate your order.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/order/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-4 text-center">
        <p className="font-semibold text-success">Thank you for your feedback!</p>
        <p className="mt-1 flex justify-center gap-0.5" aria-label={`You rated ${rating} out of 5`}>
          {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={18} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-warm-gray"} />)}
        </p>
      </div>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-warm-gray bg-cream p-4" aria-labelledby="fb-title">
      <h2 id="fb-title" className="font-display text-lg">How was your order?</h2>
      <p className="text-xs text-secondary-text">Your feedback helps us get better.</p>
      <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="flex h-12 w-11 items-center justify-center active:scale-90">
            <Star size={30} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-warm-gray"} />
          </button>
        ))}
        <span className="ml-2 text-sm font-medium text-secondary-text">{WORDS[rating]}</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Tell us more (optional): the quality, the weight, the delivery…"
        className="mt-2 w-full rounded-xl border border-warm-gray bg-white px-3.5 py-3 text-base outline-none focus:border-accent"
      />
      {error && <p role="alert" className="mt-2 text-xs font-medium text-accent">{error}</p>}
      <button type="button" onClick={send} disabled={busy} className="btn-primary mt-3 min-h-12 w-full disabled:opacity-60">{busy ? "Sending…" : "Send feedback"}</button>
    </section>
  );
}
