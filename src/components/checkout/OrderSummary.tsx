"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { CircleAlert, Tag, X } from "lucide-react";
import { formatPrice, useCart } from "@/src/components/cart/CartContext";
import ComboStrip from "@/src/components/cart/ComboStrip";
import FreeShippingBar from "@/src/components/cart/FreeShippingBar";
import {
  COMBO_CATEGORY,
  comboDetails,
  findCombo,
} from "@/src/components/product-showcase/data";
import { Link } from "@/src/i18n/navigation";
import { FREE_SHIPPING_FROM } from "@/src/lib/shop";

interface OrderSummaryProps {
  totals: {
    subtotal: number;
    discountAmount: number;
    /** Subtotal ya con descuento (base del envío gratis) */
    afterDiscount: number;
    /** null mientras no se elige departamento */
    shipping: number | null;
    total: number;
  };
  discount: { code: string; percent: number } | null;
  /** Devuelve false si el código no es válido */
  onApplyCode: (code: string) => boolean;
  onRemoveCode: () => void;
}

/** Resumen del pedido: envío gratis, productos, código de descuento y totales */
export default function OrderSummary({
  totals,
  discount,
  onApplyCode,
  onRemoveCode,
}: OrderSummaryProps) {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tShop = useTranslations("shop");
  const tEditions = useTranslations("editions");
  const { items } = useCart();
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const codeId = useId();

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const ok = onApplyCode(code);
    setInvalid(!ok);
    if (ok) setCode("");
  };

  return (
    <div className="space-y-5 pt-4 lg:pt-0">
      {/* Recuadro destacado: progreso hacia el envío gratis */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <FreeShippingBar subtotal={totals.afterDiscount} />
        {totals.afterDiscount < FREE_SHIPPING_FROM && (
          <Link
            href="/our-coffee/products"
            className="mt-3 flex w-full items-center justify-center rounded-xl bg-gray-900 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#116e78]"
          >
            {t("keepShopping")}
          </Link>
        )}
      </div>

      {/* Productos */}
      <ul className="space-y-3.5">
        {items.map((item) => {
          const combo =
            item.categoryId === COMBO_CATEGORY
              ? findCombo(item.productId)
              : undefined;
          const name = combo
            ? tCart(`combos.${combo.id}.name`)
            : tEditions(`${item.categoryId}.products.${item.productId}`);
          return (
            <li key={item.key} className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {combo ? (
                    <ComboStrip
                      products={comboDetails(combo).products}
                      width={56}
                      className="h-full w-full"
                    />
                  ) : (
                    item.image && (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )
                  )}
                </div>
                {/* Cantidad sobre la miniatura */}
                <span
                  aria-hidden
                  className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-semibold text-white"
                >
                  {item.qty}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13px] font-semibold text-gray-900">
                  {name}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {tShop(`sizes.${item.size}`)}
                  {combo && ` ${tShop("each")}`} ·{" "}
                  {tShop(`grinds.${item.grind}`)}
                </p>
                <p className="sr-only">{t("quantity", { count: item.qty })}</p>
              </div>
              <data
                value={item.qty * item.price}
                className="text-[13px] font-semibold tabular-nums text-gray-900"
              >
                {formatPrice(item.qty * item.price)}
              </data>
            </li>
          );
        })}
      </ul>

      {/* Código de descuento */}
      {discount ? (
        <p className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-[13px] ring-1 ring-gray-200">
          <span className="flex items-center gap-2 font-semibold text-[#116e78]">
            <Tag size={16} aria-hidden />
            {t("discountApplied", {
              code: discount.code,
              percent: discount.percent,
            })}
          </span>
          <button
            type="button"
            onClick={onRemoveCode}
            aria-label={t("removeDiscount")}
            className="cursor-pointer rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={16} />
          </button>
        </p>
      ) : (
        <form onSubmit={apply} noValidate>
          <div className="flex gap-2.5">
            <div className="relative min-w-0 flex-1">
              <input
                id={codeId}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setInvalid(false);
                }}
                placeholder=" "
                autoComplete="off"
                aria-invalid={invalid}
                aria-describedby={invalid ? `${codeId}-error` : undefined}
                /* Anillo de enfoque hacia dentro (ring-inset): el resumen fijo
                   tiene scroll interno y recortaría un anillo exterior */
                className={`peer w-full rounded-xl border bg-white px-3 pb-1.5 pt-5 text-sm uppercase transition-colors focus:outline-none focus:ring-1 focus:ring-inset ${
                  invalid
                    ? "border-red-500 ring-1 ring-inset ring-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                }`}
              />
              <label
                htmlFor={codeId}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 transition-all peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]"
              >
                {t("discountCode")}
              </label>
            </div>
            <button
              type="submit"
              disabled={!code.trim()}
              className="rounded-xl bg-gray-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#2f2f2f] hover:cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              {t("apply")}
            </button>
          </div>
          {invalid && (
            <p
              id={`${codeId}-error`}
              role="alert"
              className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
            >
              <CircleAlert size={14} aria-hidden className="shrink-0" />
              {t("discountInvalid")}
            </p>
          )}
        </form>
      )}

      {/* Totales */}
      <dl className="space-y-2 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-gray-600">{t("subtotal")}</dt>
          <dd className="tabular-nums text-gray-900">
            <data value={totals.subtotal}>{formatPrice(totals.subtotal)}</data>
          </dd>
        </div>
        {totals.discountAmount > 0 && (
          <div className="flex justify-between text-[#116e78]">
            <dt>{t("discount")}</dt>
            <dd className="tabular-nums">
              <data value={-totals.discountAmount}>
                −{formatPrice(totals.discountAmount)}
              </data>
            </dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-gray-600">{t("shipping")}</dt>
          <dd className="tabular-nums text-gray-900">
            {totals.shipping === null ? (
              <span className="text-gray-500">{t("enterDepartment")}</span>
            ) : totals.shipping === 0 ? (
              <span className="font-semibold text-[#116e78]">{t("free")}</span>
            ) : (
              <data value={totals.shipping}>
                {formatPrice(totals.shipping)}
              </data>
            )}
          </dd>
        </div>
        <div className="flex items-baseline justify-between pt-3">
          <dt className="text-lg font-bold text-gray-900">{t("total")}</dt>
          <dd aria-live="polite" className="flex items-baseline gap-2">
            <span className="text-xs text-gray-500">PEN</span>
            <data
              value={totals.total}
              className="text-xl font-bold tabular-nums text-gray-900"
            >
              {formatPrice(totals.total)}
            </data>
          </dd>
        </div>
      </dl>
    </div>
  );
}
