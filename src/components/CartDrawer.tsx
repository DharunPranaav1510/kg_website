"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X, CheckCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    isDrawerOpen,
    closeDrawer,
    updateWeight,
    removeItem,
    clearCart,
  } = useCart();

  type Step = "cart" | "form" | "confirmation";
  const [step, setStep] = useState<Step>("cart");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [formErrorMessage, setFormErrorMessage] = useState("");

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) {
      setStep("cart");
      setSubmitting(false);
      setFormErrors({});
      setFormErrorMessage("");
      setName("");
      setPhone("");
      setAddress("");
      setNote("");
    }
  }, [isDrawerOpen]);

  const handleCheckout = () => {
    if (items.length === 0) return;
    setStep("form");
  };

  const handleClose = () => {
    setStep("cart");
    closeDrawer();
  };

  const validateForm = () => {
    const errors: typeof formErrors = {};
    if (!name.trim()) errors.name = "Name is required";
    if (!phone.trim()) errors.phone = "Phone is required";
    if (!address.trim()) errors.address = "Address is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async () => {
    setFormErrorMessage("");
    if (!validateForm()) return;
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      note: note.trim(),
      items: items.map((item) => ({
        name: item.product.name,
        quantity: item.product.isEgg
          ? `${item.weightKg === 0.5 ? "½" : item.weightKg} dozen`
          : `${item.weightKg} kg`,
        price: Math.round(item.product.pricePerKg * item.weightKg),
      })),
      total: subtotal,
    };

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Order failed");

      // success
      setStep("confirmation");
      clearCart();
    } catch (err) {
      console.error(err);
      setFormErrorMessage("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (!isDrawerOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
        onClick={handleClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="fixed top-0 right-0 h-full w-full md:max-w-md bg-background z-[70] shadow-hover flex flex-col transition-transform duration-300 ease-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-5 border-b border-warm-gray">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-accent" strokeWidth={1.75} />
            <div>
              <h2 className="font-display text-xl text-primary-text">Your Cart</h2>
              <p className="text-xs text-secondary-text">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close cart"
            className="p-2 rounded-full hover:bg-warm-gray transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {step === "confirmation" ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-5">
              <CheckCircle size={48} className="text-success" />
            </div>
            <h3 className="font-display text-2xl text-primary-text mb-3">Order Placed!</h3>
            <p className="text-secondary-text text-sm leading-relaxed mb-8 max-w-xs">
              We&apos;ve received your order and will call you at <span className="font-semibold text-primary-text">{phone}</span> to confirm delivery.
            </p>
            <button
              type="button"
              onClick={() => {
                setStep("cart");
                handleClose();
              }}
              className="btn-primary"
            >
              Continue Shopping
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-warm-gray flex items-center justify-center mb-5">
              <ShoppingBag size={28} className="text-secondary-text" />
            </div>
            <h3 className="font-display text-xl text-primary-text mb-2">
              Your cart is empty
            </h3>
            <p className="text-secondary-text text-sm mb-8">
              Browse our fresh products and add items to get started.
            </p>
            <Link href="/shop" onClick={closeDrawer} className="btn-primary">
              Shop Products
            </Link>
          </div>
        ) : step === "cart" ? (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
              {items.map(({ product, weightKg }) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-3 bg-white rounded-xl shadow-soft border border-warm-gray/60"
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-warm-gray flex-shrink-0">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-secondary-text">
                          {product.category}
                        </p>
                        <h3 className="font-medium text-sm text-primary-text leading-tight">
                          {product.name}
                        </h3>
                        <p className="text-xs text-secondary-text mt-0.5">
                          {product.isEgg
                            ? `${weightKg === 0.5 ? "½" : weightKg} dozen`
                            : `${weightKg} kg`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        aria-label={`Remove ${product.name}`}
                        className="p-1.5 text-secondary-text hover:text-accent transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Weight +/- */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const stepVal = product.isEgg ? 0.5 : 0.25;
                            updateWeight(product.id, Math.max(product.isEgg ? 0.5 : 0.25, weightKg - stepVal));
                          }}
                          className="w-7 h-7 rounded-full bg-warm-gray text-primary-text text-sm hover:bg-accent/10 transition-colors flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold min-w-[3rem] text-center">
                          {product.isEgg
                            ? `${weightKg === 0.5 ? "½" : weightKg}dz`
                            : `${weightKg}kg`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const stepVal = product.isEgg ? 0.5 : 0.25;
                            const max = product.isEgg ? 2 : 3;
                            updateWeight(product.id, Math.min(max, weightKg + stepVal));
                          }}
                          className="w-7 h-7 rounded-full bg-accent text-white text-sm hover:bg-accent-light transition-colors flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="font-bold text-primary-text">
                        ₹{Math.round(product.pricePerKg * weightKg)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-warm-gray px-5 sm:px-6 py-5 space-y-4 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-secondary-text">Subtotal</span>
                <span className="font-display text-2xl text-primary-text">₹{subtotal}</span>
              </div>
              <p className="text-xs text-secondary-text">
                Delivery charges calculated at confirmation. Cold-chain packaging
                included for all meat orders.
              </p>
              <button
                type="button"
                onClick={handleCheckout}
                className="btn-primary w-full py-4 text-base"
              >
                Place Order
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="w-full text-sm text-secondary-text hover:text-accent transition-colors py-2"
              >
                Clear Cart
              </button>
            </div>
          </>
        ) : (
          // Form step
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <h3 className="font-display text-xl text-primary-text mb-6">Delivery Details</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  inputMode="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }));
                  }}
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:shadow-glow transition-all ${
                    formErrors.name ? "border-accent" : "border-warm-gray focus:border-accent/40"
                  }`}
                  placeholder="Your full name"
                />
                {formErrors.name && (
                  <p className="text-xs text-accent mt-1.5">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:shadow-glow transition-all ${
                    formErrors.phone ? "border-accent" : "border-warm-gray focus:border-accent/40"
                  }`}
                  placeholder="+91 98765 43210"
                />
                {formErrors.phone && (
                  <p className="text-xs text-accent mt-1.5">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-1.5">
                  Delivery Address
                </label>
                <textarea
                  rows={3}
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (formErrors.address) setFormErrors((p) => ({ ...p, address: undefined }));
                  }}
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:shadow-glow transition-all resize-none ${
                    formErrors.address ? "border-accent" : "border-warm-gray focus:border-accent/40"
                  }`}
                  placeholder="House/flat no., street, area, Hosur"
                />
                {formErrors.address && (
                  <p className="text-xs text-accent mt-1.5">{formErrors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-1.5">
                  Note for shop {" "}
                  <span className="text-secondary-text font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. remove skin, deliver before 6pm"
                  className="w-full px-4 py-3.5 rounded-xl border text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:shadow-glow transition-all resize-none border-warm-gray focus:border-accent/40"
                />
              </div>

              {formErrorMessage && (
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs">
                  {formErrorMessage}
                </div>
              )}

              <div className="flex gap-3 pt-2 pb-6">
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="w-1/2 py-3.5 rounded-full border border-warm-gray text-sm font-medium text-primary-text hover:border-accent/40 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="w-1/2 btn-primary py-3.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending..." : "Confirm Order"}
                </button>
              </div>
            </div>
          </div>
         )}
      </aside>
    </>
  );
}
