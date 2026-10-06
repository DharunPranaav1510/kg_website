"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useBusiness } from "@/context/BusinessContext";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Shop", href: "/shop" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const business = useBusiness();
  const pathname = usePathname();
  const { itemCount, isHydrated, openDrawer } = useCart();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);

  const isSolid = !isHome || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isHydrated || itemCount === 0) return;
    setCartPulse(true);
    const t = window.setTimeout(() => setCartPulse(false), 450);
    return () => window.clearTimeout(t);
  }, [itemCount, isHydrated]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile full-screen menu — rendered outside header so no clipping */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[200] flex flex-col"
          style={{ backgroundColor: "#ffffff" }}
        >
          {/* Menu header */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-warm-gray/40 flex-shrink-0">
            <Link
              href="/"
              onClick={closeMobile}
              className="flex items-center gap-2"
              aria-label="KG Foods home"
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white border border-warm-gray flex items-center justify-center flex-shrink-0">
                <Image
                  src="/images/logo/kg-logo.png"
                  alt="KG Foods logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-base text-primary-text">
                  KG Foods
                </span>
                <span className="text-[9px] tracking-[0.12em] uppercase font-medium text-secondary-text">
                  Fresh · Hygienic · Trusted
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close menu"
              className="p-2 rounded-full hover:bg-warm-gray transition-colors"
            >
              <X size={22} className="text-primary-text" />
            </button>
          </div>

          {/* Nav links — vertically centered in remaining space */}
          <div className="flex-1 flex flex-col justify-center px-6 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className={`text-2xl font-display py-4 border-b border-warm-gray/30 last:border-0 transition-colors ${
                  pathname === link.href
                    ? "text-accent"
                    : "text-primary-text hover:text-accent"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="px-6 pb-10 flex-shrink-0">
            <Link
              href="/shop"
              onClick={closeMobile}
              className="flex items-center justify-center w-full py-4 bg-accent text-white font-semibold text-base rounded-full hover:bg-accent-light transition-colors"
            >
              Order Now
            </Link>
            <a
              href={`tel:${business.contact.phone}`}
              className="mt-3 flex items-center justify-center gap-2 w-full py-4 border border-warm-gray text-primary-text font-medium text-base rounded-full hover:border-accent/40 transition-colors"
            >
              Call the shop · {business.contact.phoneDisplay}
            </a>
          </div>
        </div>
      )}

      {/* Main navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isSolid
            ? "bg-white/95 backdrop-blur-md shadow-soft"
            : "bg-gradient-to-b from-black/60 to-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 group min-w-0"
              aria-label="KG Foods home"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-white border border-warm-gray flex items-center justify-center flex-shrink-0">
                <Image
                  src="/images/logo/kg-logo.png"
                  alt="KG Foods logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col leading-none min-w-0">
                <span
                  className={`font-display font-bold text-base sm:text-lg tracking-tight truncate transition-colors duration-300 ${
                    isSolid ? "text-primary-text" : "text-white"
                  }`}
                >
                  KG Foods
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] tracking-[0.12em] sm:tracking-[0.15em] uppercase font-medium truncate transition-colors duration-300 ${
                    isSolid ? "text-secondary-text" : "text-white/70"
                  }`}
                >
                  Fresh · Hygienic · Trusted
                </span>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 relative group ${
                    isSolid
                      ? pathname === link.href
                        ? "text-primary-text"
                        : "text-secondary-text hover:text-primary-text"
                      : pathname === link.href
                      ? "text-white"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 rounded-full transition-all duration-200 ${
                      isSolid ? "bg-accent" : "bg-white"
                    } ${
                      pathname === link.href
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* Right side icons */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                type="button"
                onClick={openDrawer}
                aria-label={`Cart (${isHydrated ? itemCount : 0} items)`}
                className={`relative p-2 sm:p-2.5 rounded-full transition-all duration-200 ${
                  isSolid
                    ? "text-secondary-text hover:text-primary-text hover:bg-warm-gray"
                    : "text-white/80 hover:text-white hover:bg-white/15"
                }`}
              >
                <ShoppingCart size={18} strokeWidth={1.75} />
                {isHydrated && itemCount > 0 && (
                  <span
                    key={itemCount}
                    className={`absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center ${
                      cartPulse ? "animate-cart-pulse" : ""
                    }`}
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>

              <Link
                href="/shop"
                className={`hidden sm:inline-flex items-center justify-center py-2.5 px-5 text-xs font-semibold rounded-full transition-all duration-200 ${
                  isSolid
                    ? "btn-primary"
                    : "bg-white text-primary-text hover:bg-white/90"
                }`}
              >
                Order Now
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                className={`md:hidden p-2 sm:p-2.5 rounded-full transition-all duration-200 ${
                  isSolid
                    ? "text-secondary-text hover:text-primary-text hover:bg-warm-gray"
                    : "text-white/80 hover:text-white hover:bg-white/15"
                }`}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

        </nav>
      </header>
    </>
  );
}