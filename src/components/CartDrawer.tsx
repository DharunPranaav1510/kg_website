"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X, Clock, MessageCircle, Phone, Lock } from "lucide-react";
import CheckoutForm, { type PlacedOrder } from "@/components/CheckoutForm";
import { useCart } from "@/context/CartContext";
import { useShopStatus } from "@/context/ShopStatusContext";
import { useBusiness } from "@/context/BusinessContext";
import { amountToFreeDelivery, deliveryFeeFor } from "@/lib/delivery";
import { formatPhone } from "@/lib/phone";

type Step = "cart" | "form" | "confirmation";

export default function CartDrawer() {
  const { items, itemCount, subtotal, isDrawerOpen, closeDrawer, updateWeight, removeItem, clearCart } = useCart();
  const shop = useShopStatus();
  const business = useBusiness();
  const MIN_ORDER = business.delivery.minOrder;
  const [step, setStep] = useState<Step>("cart");
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Lets the phone layout keep its tab bar visible except while typing the address.
  useEffect(() => {
    if (isDrawerOpen) document.body.dataset.cartStep = step;
    else delete document.body.dataset.cartStep;
    return () => {
      delete document.body.dataset.cartStep;
    };
  }, [isDrawerOpen, step]);

  // Reset when closed. The confirmation screen is only cleared on close.
  useEffect(() => {
    if (!isDrawerOpen) {
      setStep("cart");
      setPlaced(null);
    }
  }, [isDrawerOpen]);

  // Esc closes the cart.
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDrawerOpen, closeDrawer]);

  const deliveryFee = deliveryFeeFor(subtotal, business.delivery);
  const total = subtotal + deliveryFee;
  const belowMin = subtotal < MIN_ORDER;
  const hasSoldOut = items.some((i) => i.product.inStock === false);
  const toFree = amountToFreeDelivery(subtotal, business.delivery);
  const canOrder = shop.open && !belowMin && !hasSoldOut && items.length > 0;

  const buildWhatsAppUrl = () => {
    const lines = items
      .map(
        (item) =>
          `• ${item.product.name} — ${
            item.product.isEgg ? `${item.weightKg === 0.5 ? "½" : item.weightKg} dozen` : `${item.weightKg} kg`
          } — ₹${Math.round(item.product.pricePerKg * item.weightKg)}`
      )
      .join("\n");
    const text = `Hi ${business.name}, I'd like to order:\n\n${lines}\n\nItems: ₹${subtotal}`;
    return `https://wa.me/${business.contact.whatsapp.replace("+", "")}?text=${encodeURIComponent(text)}`;
  };

  if (!isDrawerOpen) return null;

  const stepIndex = step === "cart" ? 1 : step === "form" ? 2 : 3;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={closeDrawer} aria-hidden="true" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="kg-cart-drawer animate-slide-in-right fixed right-0 top-0 z-[70] flex h-[100dvh] w-full flex-col bg-background shadow-hover md:max-w-md"
      >
        <div className="flex items-center justify-between border-b border-warm-gray px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-accent" strokeWidth={1.75} />
            <div>
              <h2 className="font-display text-xl leading-tight text-primary-text">
                {step === "form" ? "Checkout" : step === "confirmation" ? "Order received" : "Your cart"}
              </h2>
              <p className="text-xs text-secondary-text">
                {step === "cart" ? `${itemCount} ${itemCount === 1 ? "item" : "items"}` : `Step ${stepIndex} of 3`}
              </p>
            </div>
          </div>
          <button type="button" onClick={closeDrawer} aria-label="Close cart" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-warm-gray">
            <X size={22} />
          </button>
        </div>

        {step === "confirmation" && placed ? (
          <div className="flex-1 overflow-y-auto px-5 py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Clock size={32} className="text-amber-700" />
            </div>
            <h3 className="font-display text-2xl text-primary-text">We&apos;ve received your order</h3>
            {placed.number && (
              <>
                <p className="mt-1 font-semibold text-accent">Order #{placed.number}</p>
                <p className="mt-0.5 text-xs text-secondary-text">Keep this number. You can look it up any time under Track Order with your mobile number.</p>
              </>
            )}

            <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left text-sm text-amber-900">
              <p className="font-semibold">⚠ Not confirmed yet</p>
              <p className="mt-1">
                Your order is confirmed only when someone from {business.name} calls you on{" "}
                <b>{formatPhone(placed.phone)}</b>. Please keep your phone nearby.
              </p>
            </div>

            <ol className="mx-auto mt-5 max-w-sm space-y-3 text-left text-sm">
              {[
                ["done", "Order received"],
                ["now", `We call ${formatPhone(placed.phone)} to confirm`],
                ["next", `Delivery — pay ₹${placed.total} on delivery`],
              ].map(([state, text], i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${state === "done" ? "bg-success text-white" : state === "now" ? "bg-amber-400 text-white" : "bg-warm-gray text-secondary-text"}`}>
                    {state === "done" ? "✓" : i + 1}
                  </span>
                  <span className={state === "next" ? "text-secondary-text" : "font-medium text-primary-text"}>{text}</span>
                </li>
              ))}
            </ol>

            <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
              {placed.id && (
                <Link href={`/order/${placed.id}`} onClick={closeDrawer} className="btn-primary min-h-12">
                  Track your order
                </Link>
              )}
              <a href={`tel:${business.contact.phone}`} className="btn-secondary min-h-12">
                <Phone size={15} /> Call the shop · {business.contact.phoneDisplay}
              </a>
              <button type="button" onClick={closeDrawer} className="min-h-11 text-sm text-secondary-text hover:text-accent">
                Continue shopping
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-warm-gray">
              <ShoppingBag size={28} className="text-secondary-text" />
            </div>
            <h3 className="mb-2 font-display text-xl text-primary-text">Your cart is empty</h3>
            <p className="mb-8 text-sm text-secondary-text">Browse our fresh products and add items to get started.</p>
            <Link href="/shop" onClick={closeDrawer} className="btn-primary">Shop Products</Link>
          </div>
        ) : step === "form" ? (
          <CheckoutForm
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            onBack={() => setStep("cart")}
            onPlaced={(order) => {
              setPlaced(order);
              setStep("confirmation");
            }}
          />
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
              {items.map(({ product, weightKg }) => (
                <div key={product.id} className="flex gap-3 rounded-xl border border-warm-gray/60 bg-white p-3 shadow-soft">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-warm-gray">
                    <Image src={product.image} alt={product.name} fill className="object-cover" sizes="80px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wide text-secondary-text">{product.category}</p>
                        <h3 className="text-sm font-medium leading-tight text-primary-text">{product.name}</h3>
                        {product.inStock === false && <p className="mt-1 text-xs font-semibold text-accent">Sold out — please remove</p>}
                      </div>
                      <button type="button" onClick={() => removeItem(product.id)} aria-label={`Remove ${product.name}`} className="-mr-2 -mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center text-secondary-text hover:text-accent">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Decrease ${product.name}`}
                          onClick={() => {
                            const min = product.isEgg ? 0.5 : 0.25;
                            updateWeight(product.id, Math.max(min, weightKg - min));
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-gray transition-colors active:bg-accent/10"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-[3.25rem] text-center text-sm font-semibold">
                          {product.isEgg ? `${weightKg === 0.5 ? "½" : weightKg} dz` : `${weightKg} kg`}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${product.name}`}
                          onClick={() => {
                            const step = product.isEgg ? 0.5 : 0.25;
                            updateWeight(product.id, Math.min(product.isEgg ? 2 : 3, weightKg + step));
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition-colors active:bg-accent-light"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-bold text-primary-text">₹{Math.round(product.pricePerKg * weightKg)}</span>
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={clearCart} className="w-full py-2 text-sm text-secondary-text hover:text-accent">Clear cart</button>
            </div>

            <div className="space-y-3 border-t border-warm-gray bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-secondary-text"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="flex justify-between text-secondary-text"><span>Delivery</span><span>{deliveryFee ? `₹${deliveryFee}` : "Free"}</span></div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-medium text-primary-text">Total · pay on delivery</span>
                  <span className="font-display text-2xl text-primary-text">₹{total}</span>
                </div>
              </div>

              {!shop.open ? (
                <p className="flex items-start gap-2 rounded-lg bg-primary-text px-3 py-2.5 text-xs text-white">
                  <Lock size={14} className="mt-0.5 flex-shrink-0" />
                  <span><b>Orders are paused.</b> {shop.message || "We're closed right now. Please check back soon."}</span>
                </p>
              ) : belowMin ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Minimum order is ₹{MIN_ORDER}. Add ₹{MIN_ORDER - subtotal} more to continue.</p>
              ) : toFree > 0 ? (
                <p className="rounded-lg bg-success/10 px-3 py-2 text-xs text-success">Add ₹{toFree} more for free delivery.</p>
              ) : null}
              {hasSoldOut && <p className="rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent">Remove the sold-out item(s) to place your order.</p>}

              <p className="text-center text-xs text-secondary-text">
                Orders are confirmed only after our team calls you.
              </p>
              <button type="button" onClick={() => canOrder && setStep("form")} disabled={!canOrder} className="btn-primary min-h-12 w-full !py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50">
                Continue to checkout
              </button>
              {shop.open && (
                <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-semibold text-white transition-opacity hover:opacity-90">
                  <MessageCircle size={16} fill="white" />
                  Order via WhatsApp instead
                </a>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
