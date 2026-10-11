"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useId } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatPrice, useCart } from "./CartContext";
import CartRecommendations from "./CartRecommendations";
import ComboStrip from "./ComboStrip";
import FreeShippingBar from "./FreeShippingBar";
import { Link } from "@/src/i18n/navigation";
import {
  COMBO_CATEGORY,
  comboDetails,
  findCombo,
} from "@/src/components/product-showcase/data";

export default function CartDrawer() {
  const t = useTranslations("cart");
  const tEditions = useTranslations("editions");
  const tShop = useTranslations("shop");
  const { items, count, total, setQty, removeItem, isOpen, closeCart } =
    useCart();
  const titleId = useId();

  /* Bloquea el scroll del fondo y cierra con Escape mientras está abierto */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  return (
    <>
      {/* Fondo oscuro */}
      <div
        className={`fixed inset-0 z-60 bg-black/40 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        inert={!isOpen}
        className={`fixed top-0 right-0 z-70 flex h-svh w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <ShoppingBag size={22} aria-hidden className="text-[#116e78]" />
            <h2 id={titleId} className="text-xl font-bold text-gray-800">
              {t("title")}
            </h2>
            {count > 0 && (
              <span className="text-sm text-gray-500">
                ({t("items", { count })})
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="cursor-pointer text-gray-500 transition-colors hover:text-[#116e78]"
            aria-label={t("close")}
          >
            <X size={22} />
          </button>
        </div>

        {/* Productos + recomendaciones (zona desplazable) */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <>
              <div className="flex flex-col items-center gap-2 px-8 pb-6 pt-10 text-center">
                <ShoppingBag size={44} className="text-gray-200" />
                <p className="text-lg font-semibold text-gray-700">
                  {t("empty")}
                </p>
                <p className="text-sm text-gray-500">{t("emptyHint")}</p>
              </div>
              <CartRecommendations variant="grid" />
            </>
          ) : (
            <>
              <ul
                aria-labelledby={titleId}
                className="divide-y divide-gray-100 px-6"
              >
                {items.map((item) => {
                  /* Un combo muestra sus cafés en tira y la lista de lo que incluye */
                  const combo =
                    item.categoryId === COMBO_CATEGORY
                      ? findCombo(item.productId)
                      : undefined;
                  const comboProducts = combo
                    ? comboDetails(combo).products
                    : [];
                  const itemName = combo
                    ? t(`combos.${combo.id}.name`)
                    : tEditions(
                        `${item.categoryId}.products.${item.productId}`,
                      );
                  return (
                    <li key={item.key} className="flex gap-4 py-5">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-gray-100">
                        {combo ? (
                          <ComboStrip
                            products={comboProducts}
                            width={80}
                            className="h-full w-full"
                          />
                        ) : (
                          item.image && (
                            <Image
                              src={item.image}
                              alt=""
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          )
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold uppercase tracking-widest text-[#116e78]">
                              {combo
                                ? t("comboLabel")
                                : tEditions(`${item.categoryId}.name`)}
                            </p>
                            <h3 className="truncate font-semibold text-gray-800">
                              {itemName}
                            </h3>
                            {combo && (
                              <p className="line-clamp-2 text-xs text-gray-500">
                                {comboProducts
                                  .map((p) =>
                                    tEditions(
                                      `${p.categoryId}.products.${p.product.id}`,
                                    ),
                                  )
                                  .join(" + ")}
                              </p>
                            )}
                            <p className="text-xs font-medium text-gray-600">
                              {tShop(`sizes.${item.size}`)}
                              {combo && ` ${tShop("each")}`} ·{" "}
                              {tShop(`grinds.${item.grind}`)}
                            </p>
                            <p className="text-sm text-gray-500">
                              <data value={item.price}>
                                {formatPrice(item.price)}
                              </data>{" "}
                              {t("unitPrice")}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.key)}
                            className="cursor-pointer text-gray-300 transition-colors hover:text-red-500"
                            aria-label={t("removeNamed", { name: itemName })}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div
                            role="group"
                            aria-label={t("quantityOf", { name: itemName })}
                            className="flex items-center border border-gray-200"
                          >
                            <button
                              onClick={() => setQty(item.key, item.qty - 1)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#116e78]"
                              aria-label={t("decrease")}
                            >
                              <Minus size={14} />
                            </button>
                            <output
                              aria-live="polite"
                              className="w-9 text-center text-sm font-semibold tabular-nums text-gray-800"
                            >
                              {item.qty}
                            </output>
                            <button
                              onClick={() => setQty(item.key, item.qty + 1)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#116e78]"
                              aria-label={t("increase")}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <data
                            value={item.qty * item.price}
                            className="font-semibold tabular-nums text-gray-800"
                          >
                            {formatPrice(item.qty * item.price)}
                          </data>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-gray-100 bg-gray-50/60">
                <CartRecommendations variant="row" />
              </div>
            </>
          )}
        </div>

        {/* Total + pagar */}
        <div className="space-y-4 border-t border-gray-100 px-6 py-5">
          {items.length > 0 && <FreeShippingBar subtotal={total} />}
          <dl className="flex items-center justify-between">
            <dt className="text-lg font-semibold text-gray-700">
              {tShop("subtotal")}
            </dt>
            <dd
              aria-live="polite"
              className="text-2xl font-bold tabular-nums text-gray-900"
            >
              <data value={total}>{formatPrice(total)}</data>
            </dd>
          </dl>
          {items.length > 0 ? (
            <>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block w-full bg-[#116e78] py-4 text-center text-lg font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#0d5960]"
              >
                {t("pay")}
              </Link>
              <p className="text-center text-xs text-gray-500">
                {tShop("shippingAtCheckout")}
              </p>
            </>
          ) : (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed bg-gray-300 py-4 text-lg font-bold uppercase tracking-wide text-white"
            >
              {t("pay")}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
