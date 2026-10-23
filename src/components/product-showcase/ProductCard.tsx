"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { ShoppingBag } from "lucide-react";
import { ShowcaseProduct } from "./types";
import { CERTIFICATIONS, inStock } from "./data";
import { formatPrice, useCart } from "@/src/components/cart/CartContext";
import { DEFAULT_SIZE, sizesOf } from "@/src/lib/shop";

interface ProductCardProps {
  product: ShowcaseProduct;
  /** Edición a la que pertenece el producto (para el carrito) */
  categoryId: string;
  /** Color de la categoría, usado como fondo cuando el producto no define `cardBg` */
  accent: string;
  /** Nombre traducido del producto (i18n) */
  name: string;
}

/* Tamaños responsivos: 1 columna en móvil y tablet, 3 en escritorio (lg) */
const IMG_SIZES = "(max-width: 1023px) 100vw, 33vw";

export default function ProductCard({
  product,
  categoryId,
  accent,
  name,
}: ProductCardProps) {
  const t = useTranslations("cart");
  const tShop = useTranslations("shop");
  const { openQuickAdd } = useCart();
  const cardBg = product.cardBg ?? accent;
  const headingId = useId();
  const fromPrice = tShop("from", {
    price: formatPrice(product.prices[DEFAULT_SIZE]),
  });
  /* Sin stock en ninguna presentación */
  const soldOut = sizesOf(product.prices).every((s) => !inStock(product, s));

  return (
    <article
      aria-labelledby={headingId}
      className="group relative aspect-20/21 w-full overflow-hidden shadow-[0_14px_34px_-14px_rgba(0,0,0,0.3)] ring-1 ring-black/5"
      style={{ backgroundColor: cardBg }}
    >
      {/* Imagen del producto: zoom leve al hacer hover */}
      {product.image ? (
        <Image
          src={product.image}
          alt={t("productImageAlt", { name })}
          fill
          sizes={IMG_SIZES}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
      ) : (
        <div
          className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          style={{ background: product.bg }}
        />
      )}

      {/* Sellos de certificación en un cintillo blanco pegado al borde izquierdo */}
      {product.certifications.length > 0 && (
        <ul
          aria-label={t("certifications")}
          className="pointer-events-none absolute left-0 top-[clamp(14px,1.6vw,28px)] z-20 flex items-center gap-[clamp(6px,0.6vw,10px)] rounded-r-full bg-white py-[clamp(5px,0.5vw,8px)] pl-[clamp(14px,1.6vw,28px)] pr-[clamp(12px,1.2vw,20px)] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.45)]"
        >
          {product.certifications.map((id) => {
            const cert = CERTIFICATIONS[id];
            return (
              <li
                key={id}
                title={cert.name}
                className="pointer-events-auto relative aspect-square w-9 sm:w-11 lg:w-[clamp(32px,2.6vw,44px)]"
              >
                <Image
                  src={cert.logo}
                  alt={cert.name}
                  fill
                  sizes="44px"
                  className="object-contain"
                />
              </li>
            );
          })}
        </ul>
      )}

      {/* Difuminado inferior para resaltar el nombre y el botón */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[55%] bg-linear-to-t from-black/75 via-black/35 to-transparent backdrop-blur-[6px]"
        style={{
          maskImage: "linear-gradient(to top, black 25%, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black 15%, transparent)",
        }}
      />

      {soldOut && (
        <span className="absolute left-3 top-3 z-30 rounded-full bg-gray-900 px-3 py-1 font-ui text-xs font-bold uppercase tracking-wide text-white">
          {tShop("soldOut")}
        </span>
      )}

      {/* Nombre sobre la imagen + barra "Agregar al carrito" pegada al borde inferior */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end">
        <h3
          id={headingId}
          className="px-[clamp(16px,2vw,32px)] pb-[clamp(14px,1.6vw,24px)] text-center text-[clamp(22px,1.8vw,36px)] font-bold leading-tight text-white drop-shadow-md"
        >
          {name}
        </h3>
        <button
          type="button"
          onClick={() =>
            openQuickAdd({ kind: "product", categoryId, productId: product.id })
          }
          aria-haspopup="dialog"
          aria-label={t("addNamed", { name, price: fromPrice })}
          className="group/btn pointer-events-auto relative flex w-full cursor-pointer items-center justify-between gap-3 overflow-hidden whitespace-nowrap bg-white px-[clamp(14px,1.8vw,28px)] py-[clamp(10px,1vw,16px)] text-[clamp(13px,1vw,16px)] font-bold tracking-wide text-[#116e78] transition-colors duration-300 hover:bg-[#116e78] hover:text-white"
        >
          {/* Destello que cruza la barra cada pocos segundos */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-transparent via-[#116e78]/15 to-transparent motion-safe:animate-[shine_3.5s_ease-in-out_infinite] group-hover/btn:hidden"
          />

          <span className="relative flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#116e78] text-white transition-[transform,background-color,color] duration-300 group-hover/btn:scale-110 group-hover/btn:bg-white group-hover/btn:text-[#116e78]">
              <ShoppingBag
                size={17}
                strokeWidth={2.4}
                className="transition-transform duration-300 group-hover/btn:-rotate-12"
              />
            </span>
            <span>{t("add")}</span>
          </span>
          <data
            value={product.prices[DEFAULT_SIZE]}
            className="relative tabular-nums"
          >
            <span className="mr-1.5 text-[0.75em] font-semibold opacity-70">
              {tShop("fromLabel")}
            </span>
            <span className="text-[1.1em]">
              {formatPrice(product.prices[DEFAULT_SIZE])}
            </span>
          </data>
        </button>
      </div>
    </article>
  );
}
