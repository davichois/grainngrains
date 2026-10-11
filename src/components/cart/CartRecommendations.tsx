"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { Plus } from "lucide-react";
import {
  CATEGORIES,
  COMBOS,
  COMBO_CATEGORY,
  comboDetails,
  findCombo,
} from "@/src/components/product-showcase/data";
import type { ShowcaseProduct } from "@/src/components/product-showcase/types";
import { formatPrice, useCart } from "./CartContext";
import { DEFAULT_SIZE } from "@/src/lib/shop";
import ComboStrip from "./ComboStrip";

interface Suggestion {
  categoryId: string;
  /** Fondo de la miniatura (mismo color que la tarjeta de la colección) */
  bg: string;
  product: ShowcaseProduct;
}

/* Cafés que aún no están en el carrito, intercalando ediciones para que
   las recomendaciones sean variadas (uno de cada edición por vuelta) */
function pickSuggestions(inCart: Set<string>, limit: number) {
  const queues = CATEGORIES.map((c) =>
    c.products
      .filter((p) => !inCart.has(`${c.id}.${p.id}`))
      .map((p) => ({ categoryId: c.id, bg: p.cardBg ?? c.color, product: p })),
  );
  const picked: Suggestion[] = [];
  while (picked.length < limit && queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      const next = q.shift();
      if (next && picked.length < limit) picked.push(next);
    }
  }
  return picked;
}

interface CartRecommendationsProps {
  /** "grid": carrito vacío (2 columnas). "row": carrito con productos (carrusel) */
  variant: "grid" | "row";
}

export default function CartRecommendations({
  variant,
}: CartRecommendationsProps) {
  const t = useTranslations("cart");
  const tEditions = useTranslations("editions");
  const { items, openQuickAdd } = useCart();
  const coffeesHeadingId = useId();
  const combosHeadingId = useId();

  /* Cafés y combos que ya están en el carrito (en cualquier presentación);
     los cafés que vienen dentro de un combo tampoco se sugieren */
  const inCart = new Set(items.map((i) => `${i.categoryId}.${i.productId}`));
  const coffeesInCart = new Set(inCart);
  for (const i of items) {
    if (i.categoryId !== COMBO_CATEGORY) continue;
    findCombo(i.productId)?.items.forEach((c) =>
      coffeesInCart.add(`${c.categoryId}.${c.productId}`),
    );
  }
  const suggestions = pickSuggestions(
    coffeesInCart,
    variant === "grid" ? 4 : 6,
  );
  const combos = COMBOS.filter(
    (c) => !inCart.has(`${COMBO_CATEGORY}.${c.id}`),
  ).map((combo) => ({ combo, ...comboDetails(combo) }));
  if (suggestions.length === 0 && combos.length === 0) return null;

  const addButton = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label={`${t("add")}: ${label}`}
      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#116e78]/10 text-[#116e78] transition-all duration-300 hover:bg-[#116e78] hover:text-white active:scale-90"
    >
      <Plus size={16} strokeWidth={2.5} />
    </button>
  );

  const heading = (id: string, text: string) => (
    <h3
      id={id}
      className={`mb-4 text-[12px] font-bold uppercase tracking-widest text-[#116e78] ${
        variant === "row" ? "px-6" : ""
      }`}
    >
      {text}
    </h3>
  );

  return (
    <div
      className={variant === "grid" ? "space-y-8 px-6 pb-6" : "space-y-6 py-5"}
    >
      {suggestions.length > 0 && (
        <section aria-labelledby={coffeesHeadingId}>
          {heading(
            coffeesHeadingId,
            variant === "grid" ? t("recommended") : t("alsoLike"),
          )}

          <ul
            className={
              variant === "grid"
                ? "grid grid-cols-2 gap-3"
                : "flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-6 px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            }
          >
            {suggestions.map((s) => {
              const key = `${s.categoryId}.${s.product.id}`;
              const name = tEditions(
                `${s.categoryId}.products.${s.product.id}`,
              );
              return (
                <li
                  key={key}
                  className={`group flex flex-col overflow-hidden border border-gray-100 bg-white ${
                    variant === "row" ? "w-36 shrink-0 snap-start" : ""
                  }`}
                >
                  <div
                    className="relative aspect-square w-full overflow-hidden"
                    style={{ backgroundColor: s.bg }}
                  >
                    {s.product.image && (
                      <Image
                        src={s.product.image}
                        alt=""
                        fill
                        sizes="180px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        {tEditions(`${s.categoryId}.name`)}
                      </p>
                      <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-800">
                        {name}
                      </h4>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <data
                        value={s.product.prices[DEFAULT_SIZE]}
                        className="text-sm font-bold tabular-nums text-gray-900"
                      >
                        {formatPrice(s.product.prices[DEFAULT_SIZE])}
                      </data>
                      {addButton(name, () =>
                        openQuickAdd({
                          kind: "product",
                          categoryId: s.categoryId,
                          productId: s.product.id,
                        }),
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Combos con descuento */}
      {combos.length > 0 && (
        <section aria-labelledby={combosHeadingId}>
          {heading(combosHeadingId, t("combosTitle"))}
          <ul
            className={
              variant === "grid"
                ? "space-y-3"
                : "flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-6 px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            }
          >
            {combos.map(({ combo, products, regular, price }) => {
              const key = `${COMBO_CATEGORY}.${combo.id}`;
              const name = t(`combos.${combo.id}.name`);
              return (
                <li
                  key={key}
                  className={`flex flex-col overflow-hidden border border-gray-100 bg-white ${
                    variant === "row" ? "w-64 shrink-0 snap-start" : ""
                  }`}
                >
                  <div className="relative">
                    <ComboStrip
                      products={products}
                      width={variant === "row" ? 256 : 400}
                      className={variant === "row" ? "h-24" : "h-28"}
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-[#F63049] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                      {t("save", { percent: combo.discount })}
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        {t("items", { count: products.length })}
                      </p>
                      <h4 className="truncate text-sm font-semibold text-gray-800">
                        {name}
                      </h4>
                      <p className="mt-1 flex items-baseline gap-2 tabular-nums">
                        <data
                          value={price}
                          className="text-sm font-bold text-gray-900"
                        >
                          {formatPrice(price)}
                        </data>
                        <s className="text-xs text-gray-400">
                          <span className="sr-only">{t("regularPrice")}: </span>
                          {formatPrice(regular)}
                        </s>
                      </p>
                    </div>
                    {addButton(name, () =>
                      openQuickAdd({ kind: "combo", comboId: combo.id }),
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
