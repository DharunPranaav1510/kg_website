"use client";

import { MessageCircle } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";

export default function WhatsAppFab() {
  const business = useBusiness();
  const href = `https://wa.me/${business.contact.whatsapp.replace("+", "")}?text=${encodeURIComponent(
    "Hi KG Meat Mart, I'd like to place an order."
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Order on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 pl-4 pr-5 py-3.5 bg-[#25D366] text-white rounded-full shadow-hover hover:scale-105 active:scale-95 transition-all duration-200 md:hidden"
    >
      <MessageCircle size={20} fill="white" />
      <span className="text-sm font-semibold">WhatsApp</span>
    </a>
  );
}
