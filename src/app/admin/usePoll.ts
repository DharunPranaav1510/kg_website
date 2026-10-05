import { useEffect, useRef } from "react";

/**
 * Run `fn` every `ms` while the tab is visible (not in a background tab), and
 * once more as soon as the tab comes back. Saves server work and money.
 */
export function usePoll(fn: () => void, ms: number) {
  const latest = useRef(fn);
  latest.current = fn;

  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && latest.current();
    const id = setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [ms]);
}
