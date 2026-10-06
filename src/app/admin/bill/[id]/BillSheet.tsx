"use client";

import { useState } from "react";
import { Printer, X } from "lucide-react";
import { buildBill, rupeesInWords, type BillOrder } from "@/lib/bill";
import { formatPhone } from "@/lib/phone";

interface Shop {
  name: string;
  legalName: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  fssai: string;
  website: string;
}

type Order = BillOrder & { customer_name: string; phone: string; address: string; slot: string | null; status: string };

const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function BillSheet({ order, shop }: { order: Order; shop: Shop }) {
  const [size, setSize] = useState<"a4" | "thermal">("a4");
  const bill = buildBill(order);
  const taxInvoice = !!shop.gstin && bill.gstTotal > 0;
  const placed = new Date(order.created_at);
  const billNo = `KG-${String(order.order_number).padStart(5, "0")}`;
  const thermal = size === "thermal";

  return (
    <div className="min-h-screen bg-warm-gray/40 print:bg-white">
      {/* The page size follows the choice, so the browser's print dialog opens on the right paper. */}
      <style>{`@page { size: ${thermal ? "80mm auto" : "A4"}; margin: ${thermal ? "3mm" : "12mm"}; }
        @media print { .no-print { display: none !important; } body { background: #fff !important; } .bill { box-shadow: none !important; margin: 0 !important; } }`}</style>

      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-warm-gray bg-white px-4 py-3">
        <span className="mr-auto font-medium">Bill {billNo}</span>
        <span className="flex rounded-full border border-warm-gray p-0.5 text-sm" role="radiogroup" aria-label="Paper size">
          {([["a4", "A4 paper"], ["thermal", "Receipt 80 mm"]] as const).map(([v, l]) => (
            <button key={v} role="radio" aria-checked={size === v} onClick={() => setSize(v)} className={`rounded-full px-3.5 py-1.5 ${size === v ? "bg-primary-text text-white" : ""}`}>{l}</button>
          ))}
        </span>
        <button onClick={() => window.print()} className="btn-primary !px-6 !py-2.5"><Printer size={16} /> Print</button>
        <button onClick={() => window.close()} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-warm-gray"><X size={18} /></button>
      </div>

      <div className={`bill mx-auto my-6 bg-white text-primary-text shadow-card print:my-0 ${thermal ? "w-[80mm] p-3 text-[11px]" : "w-full max-w-[210mm] p-8 text-sm"}`}>
        <header className="text-center">
          <h1 className={`font-display ${thermal ? "text-lg" : "text-2xl"} leading-tight`}>{shop.legalName || shop.name}</h1>
          {shop.legalName && shop.legalName !== shop.name && <p className="text-secondary-text">({shop.name})</p>}
          <p className="mt-1 text-secondary-text">{shop.address}</p>
          <p className="text-secondary-text">Phone {shop.phone} · {shop.email}</p>
          <p className="mt-1 font-medium">
            {shop.gstin ? `GSTIN: ${shop.gstin}` : ""}
            {shop.gstin && shop.fssai ? " · " : ""}
            {shop.fssai ? `FSSAI Lic. No. ${shop.fssai}` : ""}
          </p>
        </header>

        <p className={`my-3 border-y border-dashed border-primary-text/40 py-1.5 text-center font-semibold tracking-widest ${thermal ? "" : "text-base"}`}>{taxInvoice ? "TAX INVOICE" : "BILL"}</p>

        <div className={`grid gap-x-6 gap-y-1 ${thermal ? "grid-cols-1" : "grid-cols-2"}`}>
          <div>
            <p><b>Bill no:</b> {billNo}</p>
            <p><b>Date:</b> {placed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })} {placed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}</p>
            {order.slot && <p><b>Delivery slot:</b> {order.slot}</p>}
            <p><b>Payment:</b> {order.status === "cancelled" ? "Cancelled" : "To be paid on delivery"}</p>
          </div>
          <div>
            <p><b>Bill to:</b> {order.customer_name}</p>
            <p>{formatPhone(order.phone)}</p>
            <p className="text-secondary-text">{order.address}</p>
          </div>
        </div>

        <table className="mt-4 w-full border-collapse">
          <thead>
            <tr className="border-y border-primary-text/50 text-left text-[0.9em]">
              <th className="py-1.5 pr-1">#</th>
              <th className="py-1.5 pr-2">Item</th>
              <th className="py-1.5 pr-2 text-right">Qty</th>
              {!thermal && <th className="py-1.5 pr-2 text-right">Rate</th>}
              {!thermal && bill.gstTotal > 0 && <th className="py-1.5 pr-2 text-right">GST</th>}
              <th className="py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.lines.map((l) => (
              <tr key={l.n} className="border-b border-warm-gray align-top">
                <td className="py-1.5 pr-1">{l.n}</td>
                <td className="py-1.5 pr-2">
                  {l.name}
                  {l.hsn && <span className="block text-[0.85em] text-secondary-text">HSN {l.hsn}</span>}
                  {thermal && l.gstRate > 0 && <span className="block text-[0.85em] text-secondary-text">GST {l.gstRate}%</span>}
                </td>
                <td className="whitespace-nowrap py-1.5 pr-2 text-right">{l.quantity}</td>
                {!thermal && <td className="py-1.5 pr-2 text-right">{l.rate !== null ? money(l.rate) : ""}</td>}
                {!thermal && bill.gstTotal > 0 && <td className="py-1.5 pr-2 text-right">{l.gstRate ? `${l.gstRate}%` : "—"}</td>}
                <td className="py-1.5 text-right font-medium">{money(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 ml-auto w-full max-w-xs space-y-1">
          {bill.gstTotal > 0 && (
            <>
              <p className="flex justify-between"><span>Taxable value</span><span>{money(bill.taxableTotal)}</span></p>
              {bill.taxRows.map((t) => (
                <p key={t.rate} className="text-secondary-text">
                  <span className="flex justify-between"><span>CGST @ {t.rate / 2}%</span><span>{money(t.cgst)}</span></span>
                  <span className="flex justify-between"><span>SGST @ {t.rate / 2}%</span><span>{money(t.sgst)}</span></span>
                </p>
              ))}
              {bill.inclusive && <p className="text-[0.85em] text-secondary-text">Prices above include this GST.</p>}
            </>
          )}
          <p className="flex justify-between"><span>Delivery charge</span><span>{bill.deliveryFee ? money(bill.deliveryFee) : "Free"}</span></p>
          {Math.abs(bill.roundOff) >= 0.005 && <p className="flex justify-between text-secondary-text"><span>Round off</span><span>{bill.roundOff > 0 ? "+" : ""}{money(bill.roundOff)}</span></p>}
          <p className={`flex justify-between border-t border-primary-text/60 pt-1.5 font-bold ${thermal ? "text-base" : "text-lg"}`}><span>TOTAL</span><span>₹{money(bill.total)}</span></p>
        </div>

        <p className="mt-3 border-t border-dashed border-primary-text/40 pt-2 font-medium">{rupeesInWords(bill.total)}</p>

        {bill.taxRows.length > 0 && !thermal && (
          <table className="mt-4 w-full border-collapse text-[0.9em]">
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

        <footer className="mt-5 space-y-1 text-center text-[0.9em] text-secondary-text">
          <p>Thank you for ordering from {shop.name}!</p>
          <p>Problem with your order? Tell us within 2 hours with a photo. See {shop.website.replace(/^https?:\/\//, "")}/refunds</p>
          {!thermal && <p className="pt-6 text-right text-primary-text">Authorised signatory</p>}
        </footer>
      </div>
    </div>
  );
}
