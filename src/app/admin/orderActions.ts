"use client";

import { useCallback } from "react";
import { STATUS_LABEL, type OrderStatus } from "@/lib/delivery";
import { formatPhone } from "@/lib/phone";
import { adminApi } from "./api";
import type { Order } from "./orderUtils";
import { rupees, useUi } from "./ui";

/**
 * Status changes, cancelling and blocking, shared by the live board, the order
 * history and the order panel so every screen behaves the same way:
 * the card moves at once, a toast offers Undo, and a failure puts it back.
 */
export function useOrderActions(setOrders: React.Dispatch<React.SetStateAction<Order[] | null>>, reload: () => Promise<void> | void) {
  const { toast, confirm } = useUi();

  const changeStatus = useCallback(
    async (o: Order, status: OrderStatus, withUndo = true): Promise<void> => {
      if (status === "cancelled") {
        const r = await confirm({
          title: `Cancel order #${o.order_number} for ${o.customer_name}, ${rupees(Number(o.total))}?`,
          body: "The customer will see the order as cancelled.",
          confirmLabel: "Cancel order",
          cancelLabel: "Keep order",
          danger: true,
        });
        if (r.choice !== "confirm") return;
      }
      const from = o.status;
      setOrders((prev) => prev && prev.map((x) => (x.id === o.id ? { ...x, status } : x)));
      try {
        await adminApi(`/api/admin/orders/${o.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (withUndo) {
          toast({
            text: `Order #${o.order_number} ${status === "cancelled" ? "cancelled" : `moved to ${STATUS_LABEL[status]}`}.`,
            undo: () => changeStatus({ ...o, status }, from, false),
          });
        }
      } catch (e) {
        setOrders((prev) => prev && prev.map((x) => (x.id === o.id ? { ...x, status: from } : x)));
        toast({ text: `Order #${o.order_number} was not changed. ${(e as Error).message}`, tone: "error", retry: () => changeStatus(o, status, withUndo) });
        await reload();
      }
    },
    [confirm, reload, setOrders, toast]
  );

  const block = useCallback(
    async (phone: string) => {
      const r = await confirm({
        title: `Block ${formatPhone(phone)}?`,
        body: "This number will no longer be able to place orders online.",
        confirmLabel: "Block number",
        danger: true,
        input: { label: "Reason (shown only to admins)", placeholder: "e.g. Fake order", required: true },
      });
      if (r.choice !== "confirm") return;
      try {
        await adminApi("/api/admin/blocked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, reason: r.value || "Blocked from an order" }),
        });
        toast({ text: "This number can no longer place orders." });
        await reload();
      } catch (e) {
        toast({ text: `Could not block the number. ${(e as Error).message}`, tone: "error", retry: () => block(phone) });
      }
    },
    [confirm, reload, toast]
  );

  const unblock = useCallback(
    async (phone: string) => {
      try {
        await adminApi(`/api/admin/blocked?phone=${encodeURIComponent(phone)}`, { method: "DELETE" });
        toast({ text: "Number unblocked.", undo: () => block(phone) });
        await reload();
      } catch (e) {
        toast({ text: (e as Error).message, tone: "error" });
      }
    },
    [block, reload, toast]
  );

  return { changeStatus, block, unblock };
}
