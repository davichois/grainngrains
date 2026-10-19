"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { CircleAlert, Gift, Sparkles, Tag, X } from "lucide-react";
import { formatPrice, useCart } from "@/src/components/cart/CartContext";
import ComboStrip from "@/src/components/cart/ComboStrip";
import FreeShippingBar from "@/src/components/cart/FreeShippingBar";
import {
  CATEGORIES,
  COMBO_CATEGORY,
  comboDetails,
  findCombo,
  findProduct,
} from "@/src/components/product-showcase/data";
import type { CouponFailure, CouponSuccess } from "@/src/lib/coupons";
import type { OrderTotals } from "@/src/lib/checkout/order";
import { Link } from "@/src/i18n/navigation";
import { FREE_SHIPPING_FROM } from "@/src/lib/shop";

interface OrderSummaryProps {
  totals: OrderTotals;
  /** Devuelve el motivo si el código se rechaza, o null si se aplicó */
  onApplyCode: (code: string) => CouponFailure | null;
  onRemoveCode: () => void;
}

/** Resumen del pedido: envío gratis, productos, código de descuento y totales */
export default function OrderSummary({
  totals,
  onApplyCode,
  onRemoveCode,
}: OrderSummaryProps) {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tShop = useTranslations("shop");
  const tEditions = useTranslations("editions");
  const { items } = useCart();
  const [code, setCode] = useState("");
  const [rejected, setRejected] = useState<CouponFailure | null>(null);
  const invalid = rejected !== null;
  const codeId = useId();
  const coupon = totals.coupon;

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const failure = onApplyCode(code);
    setRejected(failure);
    if (!failure) setCode("");
  };

  /* Qué falta para que el cupón aplique */
  const failureText = (f: CouponFailure) => {
    switch (f.reason) {
      case "not_found":
        return t("coupon.notFound");
      case "expired":
        return t("coupon.expired");
      case "not_started":
        return t("coupon.notStarted");
      case "wholesale":
        return t("coupon.wholesale");
      case "schedule":
        return t("coupon.schedule");
      case "customer_only":
        return t("coupon.customerOnly");
      case "newsletter":
        return t("coupon.newsletter");
      case "first_purchase":
        return t("coupon.firstPurchase");
      case "used_up":
        return t("coupon.usedUp");
      case "already_used":
        return t("coupon.alreadyUsed");
      case "unavailable":
        return t("coupon.unavailable");
      case "better_promo":
        return t("coupon.betterPromo");
      case "consumer_only":
        return t("coupon.consumerOnly");
      case "used_up_today":
        return t("coupon.usedUpToday");
      case "min_distinct":
        return t("coupon.minDistinct", { count: f.count });
      case "loyalty":
        return t("coupon.loyalty", { count: f.count });
      case "excluded_department":
        return t("coupon.excludedDepartment", {
          departments: f.departments.join(", "),
        });
      case "max_subtotal":
        return t("coupon.maxSubtotal", { amount: formatPrice(f.amount) });
      case "max_qty":
        return t("coupon.maxQty", { count: f.count });
      case "required_products":
        return t("coupon.requiredProducts", {
          products: f.products.map(productName).join(", "),
        });
      case "department":
        return t("coupon.zone", { zones: f.departments.join(", ") });
      case "payment_method":
        return t("coupon.paymentMethod", {
          methods: f.methods
            .map((m) => (m === "wallet" ? t("wallet") : t("card")))
            .join(", "),
        });
      case "min_subtotal":
        return t("coupon.minSubtotal", {
          missing: formatPrice(Math.max(f.amount - totals.subtotal, 0)),
          amount: formatPrice(f.amount),
        });
      case "min_qty":
        return t("coupon.minQty", { count: f.count });
      case "zone":
        return t("coupon.zone", {
          zones: f.zones.map((z) => t(`coupon.zones.${z}`)).join(", "),
        });
      case "no_eligible":
        if (f.editions?.length)
          return t("coupon.onlyEditions", {
            editions: f.editions.map((e) => tEditions(`${e}.title`)).join(", "),
          });
        if (f.sizes?.length)
          return t("coupon.onlySizes", {
            sizes: f.sizes.map((z) => tShop(`sizes.${z}`)).join(", "),
          });
        return t("coupon.noEligible");
    }
  };

  /* Premio del cupón en pocas palabras */
  const rewardText = (r: CouponSuccess) => {
    const reward = r.coupon.reward;
    switch (reward.type) {
      case "percent":
      case "tiered":
        return t("coupon.rewardPercent", { value: r.percent ?? 0 });
      case "fixed":
      case "fixedPrice":
        return t("coupon.rewardFixed", { amount: formatPrice(r.discount) });
      case "percentItem":
        return reward.value >= 100
          ? t("coupon.rewardFreeItem")
          : t("coupon.rewardPercentItem", { value: reward.value });
      case "buyXgetY":
        return (reward.discount ?? 100) < 100
          ? t("coupon.rewardSecondOff", { value: reward.discount ?? 100 })
          : t("coupon.rewardBuyGet", {
              take: reward.buy + reward.get,
              pay: reward.buy,
            });
      case "shippingDiscount":
        return t("coupon.rewardShippingOff", {
          amount: formatPrice(reward.value),
        });
      case "shippingPercent":
        return t("coupon.rewardShippingPercent", { value: reward.value });
      case "shippingFixed":
        return t("coupon.rewardShippingFixed", {
          amount: formatPrice(reward.price),
        });
      case "fixedPer":
        return t("coupon.rewardFixedPer", {
          amount: formatPrice(reward.value),
          every: formatPrice(reward.every),
        });
      case "freeShipping":
        return t("coupon.rewardShipping");
      case "gift":
        return t("coupon.rewardGift");
    }
  };

  /* Nombre de un producto por su id (busca en todas las ediciones) */
  function productName(id: string) {
    for (const c of CATEGORIES) {
      if (c.products.some((p) => p.id === id))
        return tEditions(`${c.id}.products.${id}`);
    }
    return id;
  }

  const manualApplied =
    coupon?.ok && totals.applied.includes(coupon) ? coupon : null;
  /* Promociones automáticas que están aplicando */
  const autoPromos = totals.applied.filter((r) => r !== manualApplied);
  const gifts = totals.applied.flatMap((r) => (r.gift ? [r.gift] : []));

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
        {gifts.map((gift) => {
          const giftProduct = findProduct(gift.categoryId, gift.productId);
          return (
            <li
              key={`${gift.categoryId}.${gift.productId}.${gift.size}`}
              className="flex items-center gap-3.5"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
                {giftProduct?.image && (
                  <Image
                    src={giftProduct.image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13px] font-semibold text-gray-900">
                  {tEditions(`${gift.categoryId}.products.${gift.productId}`)}
                </h3>
                <p className="flex items-center gap-1 text-[11px] text-[#116e78]">
                  <Gift size={12} aria-hidden />
                  {t("coupon.giftLabel")} · {tShop(`sizes.${gift.size}`)}
                </p>
              </div>
              <span className="text-[13px] font-semibold text-[#116e78]">
                {t("free")}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Promociones automáticas: se aplican solas */}
      {autoPromos.map((r) => (
        <p
          key={r.coupon.code}
          className="flex items-center gap-2 rounded-xl bg-[#116e78]/8 px-3 py-2.5 text-[13px] font-semibold text-[#116e78]"
        >
          <Sparkles size={16} aria-hidden className="shrink-0" />
          <span className="truncate">
            {t("coupon.autoPromo")} · {rewardText(r)}
          </span>
        </p>
      ))}

      {/* Código de descuento */}
      {manualApplied ? (
        <p className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5 text-[13px] ring-1 ring-gray-200">
          <span className="flex min-w-0 items-center gap-2 font-semibold text-[#116e78]">
            <Tag size={16} aria-hidden className="shrink-0" />
            <span className="truncate">
              {manualApplied.coupon.code} · {rewardText(manualApplied)}
            </span>
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
      ) : coupon && !coupon.ok && coupon.coupon ? (
        /* Cupón válido cuyas reglas aún no se cumplen: se indica qué falta */
        <div
          role="status"
          className="flex items-start justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900"
        >
          <span className="flex min-w-0 items-start gap-2">
            <Tag size={16} aria-hidden className="mt-0.5 shrink-0" />
            <span>
              <strong className="font-semibold">{coupon.coupon.code}</strong> ·{" "}
              {failureText(coupon)}
            </span>
          </span>
          <button
            type="button"
            onClick={onRemoveCode}
            aria-label={t("removeDiscount")}
            className="cursor-pointer rounded-full p-1 text-amber-700 hover:bg-amber-100"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <form onSubmit={apply} noValidate>
          <div className="flex gap-2.5">
            <div className="relative min-w-0 flex-1">
              <input
                id={codeId}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setRejected(null);
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
              {rejected && failureText(rejected)}
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
        {/* Una línea por cupón o promoción con descuento */}
        {totals.applied
          .filter((r) => r.discount > 0)
          .map((r) => (
            <div
              key={r.coupon.code}
              className="flex justify-between text-[#116e78]"
            >
              <dt>
                {t("discount")} ({r.coupon.code})
              </dt>
              <dd className="tabular-nums">
                <data value={-r.discount}>−{formatPrice(r.discount)}</data>
              </dd>
            </div>
          ))}
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
