/** Lets someone pick the other version of the site. A plain link so it works before any script loads. */
export default function ViewSwitch({ to, className = "" }: { to: "desktop" | "mobile"; className?: string }) {
  return (
    <a href={`?view=${to}`} className={`inline-block rounded-full border border-warm-gray px-4 py-2.5 text-xs font-medium text-secondary-text active:bg-warm-gray ${className}`}>
      {to === "desktop" ? "View desktop site" : "View mobile site"}
    </a>
  );
}
