import type { LiveShopStatus } from "@/lib/hours";

/** A small copy of what the storefront says, so a change can be checked before customers see it. */
export default function CustomerView({ status, title = "What customers see right now" }: { status: LiveShopStatus; title?: string }) {
  const paused = status.reason === "paused";
  return (
    <section className="rounded-2xl border border-warm-gray bg-white p-4" aria-label={title}>
      <h2 className="mb-3 font-body text-base font-semibold">{title}</h2>
      <div className={`rounded-xl p-4 text-white ${status.open ? "bg-success" : paused ? "bg-amber-600" : "bg-primary-text"}`}>
        <p className="text-sm font-semibold uppercase tracking-wide opacity-80">{status.open ? "Open now" : paused ? "Orders paused" : "Closed right now"}</p>
        <p className="mt-1 font-display text-xl leading-snug">{status.open ? `Taking orders until ${status.closesAt}` : status.opensLabel && !paused ? `We're back ${status.opensLabel}` : "Please check back soon"}</p>
        <p className="mt-2 text-base opacity-90">{status.message}</p>
        <p className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-sm">{status.open ? "Add to cart works" : status.blockedLabel || "Ordering is off"}</p>
      </div>
    </section>
  );
}
