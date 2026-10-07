"use client";

import { useCallback, useState } from "react";
import { adminApi } from "./api";
import { SHOP_CHANGED_EVENT, useUi } from "./ui";

/**
 * Open the shop outside its opening hours for today only, or end that early.
 * The server stores today's date, so it lapses by itself at midnight.
 */
export function useForceOpen(message: string, onDone?: () => void | Promise<void>) {
  const { toast } = useUi();
  const [busy, setBusy] = useState(false);

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
            text: on ? "The shop is open for the rest of today. Tomorrow it follows the usual hours again." : "The shop is closed for the rest of today.",
            undo: () => run(!on, false),
          });
        }
        await onDone?.();
      } catch (e) {
        toast({ text: `Could not change the shop. ${(e as Error).message}`, tone: "error", retry: () => run(on, withUndo) });
      }
      setBusy(false);
    },
    [message, onDone, toast]
  );

  return { busy, run };
}
