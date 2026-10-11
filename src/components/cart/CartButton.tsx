"use client";

import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./CartContext";

/** Ícono del carrito para el header, con contador de cafés */
export default function CartButton({ className = "" }: { className?: string }) {
  const t = useTranslations("cart");
  const { count, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      data-cart-icon
      className={`relative cursor-pointer text-gray-600 transition-colors hover:text-[#116e78] ${className}`}
      aria-label={count > 0 ? t("openWithCount", { count }) : t("open")}
    >
      {/* Rebote del ícono cada vez que cambia el contador */}
      <span
        key={count}
        className={`block ${count > 0 ? "animate-[cartBump_0.5s_ease-out]" : ""}`}
      >
        <ShoppingBag size={24} aria-hidden />
      </span>
      {count > 0 && (
        <span
          key={`badge-${count}`}
          aria-hidden
          className="absolute -right-2 -top-2 flex h-5 min-w-5 animate-[zoomIn_0.3s_ease-out] items-center justify-center rounded-full bg-[#116e78] px-1 text-[11px] font-bold text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
