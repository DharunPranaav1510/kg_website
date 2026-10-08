"use client";

import { useCallback, useState } from "react";
import { nextClosing, type OpeningHours } from "@/lib/hours";
import { adminApi } from "./api";
import { SHOP_CHANGED_EVENT, useUi } from "./ui";

/**
 * Open the shop outside its opening hours, or end that early. Opening lasts until the next
 * regular closing time (5 PM today if it is early morning, 5 PM tomorrow if it is past closing),
 * then the usual hours apply again by themselves. `until` says which moment that will be.
 */
export function useForceOpen(message: string, hours: OpeningHours | null | undefined, onDone?: () => void | Promise<void>) {
  const { toast } = useUi();
  const [busy, setBusy] = useState(false);
  const until = hours ? nextClosing(hours)?.label ?? "" : "";

  const run = useCallback(
    async (on: boolean, withUndo = true): Promise<void> => {
      setBusy(true);
      try {
        await adminApi("/api/admin/shop", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ open: true, message, forceOpen: on }),
        });
        window.dispatchEvent(new Event(SHOP_CHANGED_EVENT));
        if (withUndo) {
          toast({
            text: on ? `The shop is open until ${until}. After that the usual hours apply again.` : "The shop is closed again.",
            undo: () => run(!on, false),
          });
        }
        await onDone?.();
      } catch (e) {
        toast({ text: `Could not change the shop. ${(e as Error).message}`, tone: "error", retry: () => run(on, withUndo) });
      }
      setBusy(false);
    },
    [message, onDone, toast, until]
  );

  return { busy, run, until };
}
