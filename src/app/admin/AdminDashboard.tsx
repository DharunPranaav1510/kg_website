"use client";

import { useState } from "react";
import OrdersPanel from "./OrdersPanel";
import ProductsPanel from "./ProductsPanel";

export default function AdminDashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const [newOrders, setNewOrders] = useState(0);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const tabCls = (active: boolean) =>
    `px-5 py-2 rounded-full text-sm font-medium transition-colors ${
      active ? "bg-accent text-white" : "bg-white border border-warm-gray text-secondary-text hover:text-primary-text"
    }`;

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-primary-text">KG Foods Admin</h1>
          <p className="text-sm text-secondary-text">Signed in as {email}</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/orders" className="btn-primary !py-2 !px-4">Live order board</a>
          <a href="/shop" className="btn-secondary !py-2 !px-4">View shop</a>
          <button onClick={logout} className="btn-secondary !py-2 !px-4">Log out</button>
        </div>
      </header>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("orders")} className={tabCls(tab === "orders")}>
          Orders{newOrders > 0 && <span className="ml-2 rounded-full bg-white text-accent px-2 text-xs font-bold">{newOrders}</span>}
        </button>
        <button onClick={() => setTab("products")} className={tabCls(tab === "products")}>
          Products
        </button>
      </div>

      {/* Keep both mounted so orders keep polling while editing products. */}
      <div className={tab === "orders" ? "" : "hidden"}>
        <OrdersPanel onNewCount={setNewOrders} />
      </div>
      <div className={tab === "products" ? "" : "hidden"}>
        <ProductsPanel />
      </div>
    </main>
  );
}
