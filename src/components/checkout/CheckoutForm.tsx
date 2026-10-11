"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useSyncExternalStore } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
} from "lucide-react";
import { formatPrice, useCart } from "@/src/components/cart/CartContext";
import { Link } from "@/src/i18n/navigation";
import {
  DEPARTMENTS,
  FREE_SHIPPING_FROM,
  SHIPPING_DAYS,
  discountFor,
  shippingCost,
  shippingZone,
} from "@/src/lib/shop";
import OrderSummary from "./OrderSummary";
import { Field, PaymentBadge, SelectField } from "./fields";

type Receipt = "boleta" | "factura";
type PaymentMethod = "wallet" | "card";

/* true solo en el navegador: el carrito vive en localStorage */
const useHydrated = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

const sectionTitle = "mb-3 text-lg font-semibold text-gray-900";

/* Pestañas tipo "Envío / Recojo" de Shopify */
const tab = (active: boolean) =>
  `flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-semibold transition-all has-focus-visible:ring-2 has-focus-visible:ring-gray-900 ${
    active
      ? "bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
      : "text-gray-500 hover:text-gray-900"
  }`;

export default function CheckoutForm() {
  const t = useTranslations("checkout");
  const hydrated = useHydrated();
  const { items, total: subtotal } = useCart();
  const ids = {
    contact: useId(),
    delivery: useId(),
    receipt: useId(),
    payment: useId(),
  };

  const [department, setDepartment] = useState("");
  const [receipt, setReceipt] = useState<Receipt>("boleta");
  const [payment, setPayment] = useState<PaymentMethod>("wallet");
  const [discount, setDiscount] = useState<{
    code: string;
    percent: number;
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  /* Totales: descuento sobre el subtotal; el envío gratis se evalúa ya con descuento */
  const discountAmount = discount
    ? Math.round(subtotal * discount.percent) / 100
    : 0;
  const afterDiscount = subtotal - discountAmount;
  const shipping = shippingCost(department, afterDiscount);
  const total = afterDiscount + (shipping ?? 0);
  const totals = { subtotal, discountAmount, afterDiscount, shipping, total };

  const applyCode = (code: string) => {
    const percent = discountFor(code);
    if (percent === null) return false;
    setDiscount({ code: code.trim().toUpperCase(), percent });
    return true;
  };

  const summaryProps = {
    totals,
    discount,
    onApplyCode: applyCode,
    onRemoveCode: () => setDiscount(null),
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    /* TODO: enviar el pedido al servidor, que debe recalcular los precios con
       data.ts y src/lib/shop.ts (nunca confiar en los del navegador) y crear el
       pago en la pasarela elegida (Mercado Pago / Culqi / Izipay). */
    setSubmitted(true);
  };

  /* Mientras se lee el carrito del navegador */
  if (!hydrated) {
    return <div className="min-h-[60vh]" aria-busy="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-6 text-center font-ui">
        <ShoppingBag size={48} aria-hidden className="text-gray-200" />
        <p className="text-2xl font-bold text-gray-900">{t("empty")}</p>
        <p className="text-gray-500">{t("emptyHint")}</p>
        <Link
          href="/our-coffee/products"
          className="mt-4 rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-[#116e78]"
        >
          {t("goShop")}
        </Link>
      </div>
    );
  }

  const zone = department ? shippingZone(department) : null;

  return (
    /* Columnas como Shopify: formulario (31rem) + resumen (25rem), con
       la división desplazada para que todo quede centrado con márgenes iguales */
    <div className="font-ui lg:grid lg:min-h-[calc(100svh-90px)] lg:grid-cols-[calc(50%+3rem)_minmax(0,1fr)]">
      {/* Resumen plegable en móvil y tablet */}
      <details className="group border-b border-gray-200 bg-[#f7f6f3] lg:hidden">
        <summary className="mx-auto flex max-w-xl cursor-pointer list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 text-sm font-medium text-[#116e78]">
            <ShoppingBag size={18} aria-hidden />
            <span className="group-open:hidden">{t("showSummary")}</span>
            <span className="hidden group-open:inline">{t("hideSummary")}</span>
            <ChevronDown
              size={16}
              aria-hidden
              className="transition-transform group-open:rotate-180"
            />
          </span>
          <span className="text-lg font-bold tabular-nums text-gray-900">
            {formatPrice(total)}
          </span>
        </summary>
        <div className="mx-auto max-w-xl px-5 pb-6">
          <OrderSummary {...summaryProps} />
        </div>
      </details>

      {/* Formulario */}
      <div className="bg-white px-5 py-6 sm:px-8 lg:flex lg:justify-end lg:py-10 lg:pl-8 lg:pr-12">
        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-xl space-y-8 lg:mx-0 lg:max-w-[31rem]"
        >
          {/* Contacto */}
          <section aria-labelledby={ids.contact}>
            <h2 id={ids.contact} className={sectionTitle}>
              {t("contact")}
            </h2>
            <div className="space-y-2.5">
              <Field
                id="co-email"
                name="email"
                type="email"
                autoComplete="email"
                label={t("email")}
                required
              />
              <Field
                id="co-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                pattern="9[0-9]{8}"
                maxLength={9}
                prefix="+51"
                label={t("phone")}
                hint={t("phoneHint")}
                required
              />
              <label className="flex items-center gap-2.5 pt-1 text-[13px] text-gray-700">
                <input
                  type="checkbox"
                  name="newsletter"
                  className="h-4 w-4 rounded accent-gray-900"
                />
                {t("newsletter")}
              </label>
            </div>
          </section>

          {/* Entrega: solo delivery */}
          <section aria-labelledby={ids.delivery}>
            <h2 id={ids.delivery} className={sectionTitle}>
              {t("delivery")}
            </h2>
            <div className="mb-3 rounded-xl bg-gray-100 p-1">
              <p className={tab(true)}>
                <Truck size={16} aria-hidden />
                {t("homeDelivery")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field
                id="co-first"
                name="firstName"
                autoComplete="given-name"
                label={t("firstName")}
                required
              />
              <Field
                id="co-last"
                name="lastName"
                autoComplete="family-name"
                label={t("lastName")}
                required
              />
              <SelectField
                id="co-department"
                name="department"
                autoComplete="address-level1"
                label={t("department")}
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                wrapperClassName="col-span-2 sm:col-span-1"
              >
                <option value="" disabled>
                  {t("selectDepartment")}
                </option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </SelectField>
              <Field
                id="co-province"
                name="province"
                autoComplete="address-level2"
                label={t("province")}
                required
                wrapperClassName="col-span-2 sm:col-span-1"
              />
              <Field
                id="co-district"
                name="district"
                autoComplete="address-level3"
                label={t("district")}
                required
                wrapperClassName="col-span-2"
              />
              <Field
                id="co-address"
                name="address"
                autoComplete="street-address"
                label={t("address")}
                required
                wrapperClassName="col-span-2"
              />
              <Field
                id="co-reference"
                name="reference"
                label={t("reference")}
                wrapperClassName="col-span-2"
              />
            </div>

            {/* Método de envío */}
            <h3 className="mb-2.5 mt-6 text-sm font-semibold text-gray-900">
              {t("shippingMethod")}
            </h3>
            <div aria-live="polite">
              {zone ? (
                <div className="flex items-center justify-between rounded-xl border border-gray-900 bg-[#f7f6f3] px-3.5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {zone === "lima"
                        ? t("shippingLima")
                        : t("shippingProvinces")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("shippingDays", SHIPPING_DAYS[zone])}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-gray-900">
                    {shipping === 0 ? t("free") : formatPrice(shipping ?? 0)}
                  </p>
                </div>
              ) : (
                <p className="rounded-xl bg-gray-100 px-4 py-3 text-center text-[13px] text-gray-500">
                  {t("shippingPending")}
                </p>
              )}
              {zone && shipping !== 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  {t("freeShippingFrom", {
                    amount: formatPrice(FREE_SHIPPING_FROM),
                  })}
                </p>
              )}
            </div>
          </section>

          {/* Comprobante */}
          <section aria-labelledby={ids.receipt}>
            <h2 id={ids.receipt} className={sectionTitle}>
              {t("receipt")}
            </h2>
            <div
              role="radiogroup"
              aria-labelledby={ids.receipt}
              className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1"
            >
              {(["boleta", "factura"] as const).map((r) => (
                <label key={r} className={tab(receipt === r)}>
                  <input
                    type="radio"
                    name="receipt"
                    value={r}
                    checked={receipt === r}
                    onChange={() => setReceipt(r)}
                    className="sr-only"
                  />
                  {t(r)}
                </label>
              ))}
            </div>
            {receipt === "boleta" ? (
              <Field
                id="co-document"
                name="document"
                inputMode="numeric"
                pattern="[0-9]{8,12}"
                maxLength={12}
                label={t("document")}
                required
              />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-[2fr_3fr]">
                <Field
                  id="co-ruc"
                  name="ruc"
                  inputMode="numeric"
                  pattern="(10|15|17|20)[0-9]{9}"
                  maxLength={11}
                  label={t("ruc")}
                  required
                />
                <Field
                  id="co-business"
                  name="businessName"
                  autoComplete="organization"
                  label={t("businessName")}
                  required
                />
              </div>
            )}
          </section>

          {/* Pago: acordeón con insignias de cada medio */}
          <section aria-labelledby={ids.payment}>
            <h2 id={ids.payment} className={`${sectionTitle} mb-1`}>
              {t("payment")}
            </h2>
            <p className="mb-3 text-[13px] text-gray-500">
              {t("paymentSecure")}
            </p>
            <div role="radiogroup" aria-labelledby={ids.payment}>
              {(
                [
                  {
                    id: "wallet",
                    label: t("wallet"),
                    info: t("walletInfo"),
                    Icon: Smartphone,
                    badges: ["yape", "plin"],
                  },
                  {
                    id: "card",
                    label: t("card"),
                    info: t("cardInfo"),
                    Icon: CreditCard,
                    badges: ["visa", "mastercard", "amex"],
                  },
                ] as const
              ).map(({ id, label, info, Icon, badges }, i, all) => {
                const active = payment === id;
                return (
                  /* Cada opción tiene su propio borde; se solapan 1px (-mt-px) y la
                     activa se dibuja encima (z-10) con borde oscuro que envuelve
                     título + panel, sin bordes dobles */
                  <div
                    key={id}
                    className={`relative border transition-[border-color,background-color] duration-300 ${
                      i > 0 ? "-mt-px" : "rounded-t-xl"
                    } ${i === all.length - 1 ? "rounded-b-xl" : ""} ${
                      active
                        ? "z-10 border-gray-900 bg-[#f7f6f3]"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
                      <input
                        type="radio"
                        name="payment"
                        value={id}
                        checked={active}
                        onChange={() => setPayment(id)}
                        className="peer sr-only"
                      />
                      {/* Radio propio: el punto central crece al seleccionar */}
                      <span
                        aria-hidden
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900 peer-focus-visible:ring-offset-2 ${
                          active
                            ? "border-gray-900 bg-gray-900"
                            : "border-gray-400 bg-white"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full bg-white transition-transform duration-300 ease-out ${
                            active ? "scale-100" : "scale-0"
                          }`}
                        />
                      </span>
                      <span className="flex-1 text-[13px] font-semibold text-gray-900">
                        {label}
                      </span>
                      <span className="flex gap-1.5" aria-hidden>
                        {badges.map((b) => (
                          <PaymentBadge key={b} brand={b} />
                        ))}
                      </span>
                    </label>

                    {/* Panel: se despliega animando la altura (0fr → 1fr) */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        active
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                      aria-hidden={!active}
                    >
                      <div className="overflow-hidden">
                        <div className="mx-4 flex flex-col items-center gap-2 border-t border-gray-200 py-5 text-center">
                          <Icon
                            size={30}
                            strokeWidth={1.2}
                            aria-hidden
                            className="text-gray-400"
                          />
                          <p className="max-w-sm text-[13px] text-gray-600">
                            {info}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Pagar */}
          <div className="space-y-4">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#116e78]"
            >
              <Lock size={16} aria-hidden />
              {t("pay", { amount: formatPrice(total) })}
            </button>
            <p className="text-center text-xs text-gray-500">{t("terms")}</p>

            {submitted && (
              <div
                role="status"
                className="flex gap-3 rounded-xl border border-[#116e78]/30 bg-[#116e78]/5 p-3.5 text-[13px] text-gray-700"
              >
                <CheckCircle2
                  size={20}
                  aria-hidden
                  className="shrink-0 text-[#116e78]"
                />
                <p>
                  <strong className="block text-gray-900">
                    {t("readyTitle")}
                  </strong>
                  {t("readyText")}
                </p>
              </div>
            )}

            {/* Confianza */}
            <ul className="grid grid-cols-3 gap-3 border-t border-gray-200 pt-5 text-center text-[11px] text-gray-600">
              {(
                [
                  [ShieldCheck, t("trustSecure")],
                  [Truck, t("trustShipping")],
                  [BadgeCheck, t("trustCertified")],
                ] as const
              ).map(([Icon, text]) => (
                <li key={text} className="flex flex-col items-center gap-1.5">
                  <Icon
                    size={18}
                    strokeWidth={1.5}
                    aria-hidden
                    className="text-[#116e78]"
                  />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </form>
      </div>

      {/* Resumen fijo en escritorio */}
      <aside
        aria-label={t("summary")}
        className="hidden border-l border-gray-200 bg-[#f7f6f3] lg:block lg:pl-12 lg:pr-8"
      >
        {/* Fijo: solo se desplaza el formulario; si el resumen es muy largo,
            se desplaza por dentro */}
        <div className="sticky top-0 max-h-svh max-w-[25rem] overflow-y-auto py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <OrderSummary {...summaryProps} />
        </div>
      </aside>
    </div>
  );
}
