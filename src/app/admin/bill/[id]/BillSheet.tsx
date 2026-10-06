"use client";

import { useState } from "react";
import { Printer, X } from "lucide-react";
import { billNumber, buildBill, financialYear, rupeesInWords, type BillOrder } from "@/lib/bill";
import { formatPhone } from "@/lib/phone";
import { stateFromGstin } from "@/lib/states";

interface Shop {
  name: string;
  address: string;
  phone: string;
  gstin: string;
  fssai: string;
  prefix: string;
  footer: string;
  website: string;
}

type Order = BillOrder & { customer_name: string; phone: string; address: string; slot: string | null; status: string };

const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MODES = ["To be paid on delivery", "Cash", "UPI", "Card"] as const;
type Mode = (typeof MODES)[number];

export default function BillSheet({ order, shop }: { order: Order; shop: Shop }) {
  const [size, setSize] = useState<"thermal" | "a4">("thermal");
  const [mode, setMode] = useState<Mode>(order.status === "delivered" ? "Cash" : "To be paid on delivery");
  const [tendered, setTendered] = useState("");
  const bill = buildBill(order);
  const state = stateFromGstin(shop.gstin);
  const taxInvoice = !!shop.gstin && bill.gstTotal > 0;
  const placed = new Date(order.created_at);
  const thermal = size === "thermal";
  const paid = mode !== "To be paid on delivery";
  const cashGiven = mode === "Cash" && tendered !== "" ? Number(tendered) : bill.total;
  const balance = mode === "Cash" ? Math.max(0, cashGiven - bill.total) : 0;
  const itemCount = bill.lines.length;

  const date = placed.toLocaleDateString("en-GB", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }).replace(/\//g, "-");
  const time = placed.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Kolkata" }).replace(":", ":");

  return (
    <div className="min-h-screen bg-warm-gray/40 print:bg-white">
      {/* The page size follows the choice, so the browser's print dialog opens on the right paper. */}
      <style>{`@page { size: ${thermal ? "80mm auto" : "A4"}; margin: ${thermal ? "3mm" : "12mm"}; }
        @media print { .no-print { display: none !important; } body { background: #fff !important; } .bill { box-shadow: none !important; margin: 0 !important; } }`}</style>

      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-warm-gray bg-white px-4 py-3">
        <span className="mr-auto font-medium">Bill {billNumber(shop.prefix, order.order_number)}</span>
        <label className="flex items-center gap-2 text-sm">
          Payment
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className="rounded-full border border-warm-gray bg-white px-3 py-1.5 text-sm">
            {MODES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        {mode === "Cash" && (
          <label className="flex items-center gap-2 text-sm">
            Cash tendered
            <input value={tendered} onChange={(e) => setTendered(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder={String(bill.total)} className="w-24 rounded-full border border-warm-gray px-3 py-1.5 text-sm" />
          </label>
        )}
        <span className="flex rounded-full border border-warm-gray p-0.5 text-sm" role="radiogroup" aria-label="Paper size">
          {([["thermal", "Receipt 80 mm"], ["a4", "A4 paper"]] as const).map(([v, l]) => (
            <button key={v} role="radio" aria-checked={size === v} onClick={() => setSize(v)} className={`rounded-full px-3.5 py-1.5 ${size === v ? "bg-primary-text text-white" : ""}`}>{l}</button>
          ))}
        </span>
        <button onClick={() => window.print()} className="btn-primary !px-6 !py-2.5"><Printer size={16} /> Print</button>
        <button onClick={() => window.close()} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-warm-gray"><X size={18} /></button>
      </div>

      <div className={`bill mx-auto my-6 bg-white text-primary-text shadow-card print:my-0 ${thermal ? "w-[80mm] p-3 text-[11px] leading-snug" : "w-full max-w-[210mm] p-8 text-sm"}`}>
        {/* Header, in the order of the shop's own printed bill */}
        <header className="text-center font-semibold uppercase">
          <p className={thermal ? "text-[13px]" : "text-lg"}>{shop.name} ({financialYear(order.created_at)})</p>
          <p>{shop.address}</p>
          {shop.fssai && <p>FSSAI NO: {shop.fssai}</p>}
          {shop.gstin && <p>GSTIN/UIN: {shop.gstin}</p>}
          {state && <p>State Name : {state.name}, Code : {state.code}</p>}
          <p>Contact : {shop.phone}</p>
        </header>

        <p className={`mt-3 text-center font-semibold tracking-widest ${thermal ? "text-sm" : "text-base"}`}>{taxInvoice ? "TAX INVOICE" : "BILL"}</p>

        <div className="mt-1 grid grid-cols-2 gap-x-3 border-b border-dotted border-primary-text/60 pb-1.5">
          <p><b>Bill No. :</b> {billNumber(shop.prefix, order.order_number)}</p>
          <p className="text-right"><b>Time :</b> {time} hrs</p>
          <p><b>Date :</b> {date}</p>
          <p className="text-right"><b>User :</b> online</p>
        </div>
        <div className="border-b border-dotted border-primary-text/60 py-1.5">
          <p><b>Customer :</b> {order.customer_name} · {formatPhone(order.phone)}</p>
          <p className="text-secondary-text">{order.address}</p>
          {order.slot && <p><b>Delivery slot :</b> {order.slot}</p>}
        </div>

        <table className="mt-1 w-full border-collapse">
          <thead>
            <tr className="text-left align-bottom">
              <th className="py-1 pr-1">Sl</th>
              <th className="py-1 pr-1">Description</th>
              <th className="py-1 pr-1 text-right">Qty</th>
              <th className="py-1 pr-1 text-right leading-tight">Rate<span className="block text-[0.8em] font-normal">(Incl. of Tax)</span></th>
              <th className="py-1 pr-1 text-right">Rate</th>
              <th className="py-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="border-y border-dotted border-primary-text/60">
            {bill.lines.map((l) => (
              <tr key={l.n} className="align-top">
                <td className="py-1.5 pr-1">{l.n}</td>
                <td className="py-1.5 pr-1">
                  {l.name}
                  {(l.hsn || l.gstRate > 0) && <span className="block text-[0.85em] text-secondary-text">{[l.hsn && `HSN ${l.hsn}`, l.gstRate > 0 && `GST ${l.gstRate}%`].filter(Boolean).join(" · ")}</span>}
                </td>
                <td className="whitespace-nowrap py-1.5 pr-1 text-right">{l.quantity}</td>
                <td className="py-1.5 pr-1 text-right">{l.rateIncl !== null ? money(l.rateIncl) : ""}</td>
                <td className="py-1.5 pr-1 text-right">{l.rateExcl !== null ? money(l.rateExcl) : ""}</td>
                <td className="py-1.5 text-right font-medium">{money(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="flex justify-between border-b border-dotted border-primary-text/60 py-1.5 font-semibold">
          <span>Total {itemCount} {itemCount === 1 ? "item" : "items"}</span>
          <span>₹ {money(bill.itemsTotal)}</span>
        </p>

        <div className="mt-1.5 space-y-0.5">
          {bill.gstTotal > 0 && (
            <>
              <p className="flex justify-between"><span>Taxable value</span><span>{money(bill.taxableTotal)}</span></p>
              {bill.taxRows.map((t) => (
                <div key={t.rate} className="text-secondary-text">
                  <p className="flex justify-between"><span>CGST @ {t.rate / 2}%</span><span>{money(t.cgst)}</span></p>
                  <p className="flex justify-between"><span>SGST @ {t.rate / 2}%</span><span>{money(t.sgst)}</span></p>
                </div>
              ))}
              {bill.inclusive && <p className="text-[0.85em] text-secondary-text">Rates above include this GST.</p>}
            </>
          )}
          <p className="flex justify-between"><span>Delivery charge</span><span>{bill.deliveryFee ? money(bill.deliveryFee) : "Free"}</span></p>
          {Math.abs(bill.roundOff) >= 0.005 && <p className="flex justify-between text-secondary-text"><span>Round off</span><span>{bill.roundOff > 0 ? "+" : ""}{money(bill.roundOff)}</span></p>}
        </div>

        <p className={`mt-1 flex justify-between border-y border-primary-text py-1.5 font-bold ${thermal ? "text-sm" : "text-base"}`}><span>Total</span><span>₹ {money(bill.total)}</span></p>

        <div className="mt-2 space-y-0.5">
          {paid ? (
            <>
              <p className="flex justify-between"><span>{mode}</span><span>{money(mode === "Cash" ? cashGiven : bill.total)}</span></p>
              {mode === "Cash" && <p className="flex justify-between"><span>Cash Tendered :</span><span>{money(cashGiven)}</span></p>}
              {mode === "Cash" && <p className="flex justify-between"><span>Balance :</span><span>{balance > 0 ? money(balance) : ""}</span></p>}
              <p className="flex justify-between border-t border-dotted border-primary-text/60 pt-1 font-semibold"><span>Total Paid</span><span>{money(bill.total)}</span></p>
            </>
          ) : (
            <p className="flex justify-between font-semibold"><span>To be paid on delivery</span><span>{money(bill.total)}</span></p>
          )}
        </div>

        <p className="mt-2 border-t border-dotted border-primary-text/60 pt-1.5 text-[0.9em] font-medium">{rupeesInWords(bill.total)}</p>

        {bill.taxRows.length > 0 && !thermal && (
          <table className="mt-3 w-full border-collapse text-[0.9em]">
            <thead>
              <tr className="border-y border-primary-text/40 text-left">
                <th className="py-1">GST rate</th><th className="py-1 text-right">Taxable value</th><th className="py-1 text-right">CGST</th><th className="py-1 text-right">SGST</th><th className="py-1 text-right">Total tax</th>
              </tr>
            </thead>
            <tbody>
              {bill.taxRows.map((t) => (
                <tr key={t.rate} className="border-b border-warm-gray">
                  <td className="py-1">{t.rate}%</td><td className="py-1 text-right">{money(t.taxable)}</td><td className="py-1 text-right">{money(t.cgst)}</td><td className="py-1 text-right">{money(t.sgst)}</td><td className="py-1 text-right">{money(t.cgst + t.sgst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="mt-3 border-t border-dotted border-primary-text/60 pt-2 font-medium">
          We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
        </p>
        {shop.footer && <p className="mt-2 border-t border-dotted border-primary-text/60 pt-1.5 text-center font-semibold uppercase">{shop.footer}</p>}
        <p className="mt-2 text-center text-[0.85em] text-secondary-text">Problem with your order? Tell us within 2 hours with a photo. {shop.website.replace(/^https?:\/\//, "")}/refunds</p>
        {!thermal && <p className="pt-8 text-right">Authorised signatory</p>}
      </div>
    </div>
  );
}
