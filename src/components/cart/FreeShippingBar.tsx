"use client";

import { useTranslations } from "next-intl";
import { Truck } from "lucide-react";
import { FREE_SHIPPING_FROM } from "@/src/lib/shop";
import { formatPrice } from "./CartContext";

/** Progreso hacia el envío gratis: "Te faltan S/ X para el envío gratis" */
export default function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const t = useTranslations("shop");
  const remaining = Math.max(0, FREE_SHIPPING_FROM - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_FROM) * 100);

  return (
    <div className="space-y-2">
      <p
        aria-live="polite"
        className="flex items-center gap-2 text-sm text-gray-700"
      >
        <Truck size={18} aria-hidden className="shrink-0 text-[#116e78]" />
        <span>
          {remaining > 0
            ? t.rich("freeShippingRemaining", {
                amount: formatPrice(remaining),
                b: (chunks) => (
                  <strong className="text-[#116e78]">{chunks}</strong>
                ),
              })
            : t.rich("freeShippingReached", {
                b: (chunks) => (
                  <strong className="text-[#116e78]">{chunks}</strong>
                ),
              })}
        </span>
      </p>
      <div
        role="progressbar"
        aria-label={t("freeShippingProgress")}
        aria-valuemin={0}
        aria-valuemax={FREE_SHIPPING_FROM}
        aria-valuenow={Math.min(subtotal, FREE_SHIPPING_FROM)}
        className="h-1.5 overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className="h-full rounded-full bg-[#116e78] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
