import type { Coupon } from "@/src/lib/coupons";

const s = (n: number) => `S/ ${n}`;

/** Premio de un cupón en una frase (para listas y fichas) */
export function rewardText(c: Coupon) {
  const r = c.reward;
  switch (r.type) {
    case "percent":
      return `${r.value}% de descuento${r.maxDiscount ? ` (máx. ${s(r.maxDiscount)})` : ""}`;
    case "fixed":
      return `${s(r.value)} de descuento`;
    case "fixedPer":
      return `${s(r.value)} por cada ${s(r.every)}`;
    case "percentItem":
      return `${r.value}% en la bolsa ${r.target === "mostExpensive" ? "más cara" : "más barata"}`;
    case "fixedPrice":
      return `Cada bolsa a ${s(r.price)}`;
    case "buyXgetY":
      return r.discount
        ? `Paga ${r.buy}, ${r.get} al ${r.discount}% menos`
        : `Lleva ${r.buy + r.get}, paga ${r.buy}`;
    case "gift":
      return `Regalo: ${r.qty ?? 1}× ${r.productId} (${r.size})`;
    case "freeShipping":
      return "Envío gratis";
    case "shippingDiscount":
      return `${s(r.value)} menos en el envío`;
    case "shippingPercent":
      return `${r.value}% menos en el envío`;
    case "shippingFixed":
      return `Envío a ${s(r.price)}`;
    case "tiered":
      return `Escalas por ${r.by === "amount" ? "monto" : "cantidad"}: ${r.tiers.map((t) => `${t.min}→${t.percent}%`).join(", ")}`;
  }
}
