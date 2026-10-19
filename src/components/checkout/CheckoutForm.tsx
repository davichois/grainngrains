"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AlertTriangle,
  Smartphone,
  BadgeCheck,
  Loader2,
  ChevronDown,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { formatPrice, useCart } from "@/src/components/cart/CartContext";
import { Link, useRouter } from "@/src/i18n/navigation";
import {
  DEPARTMENTS,
  FREE_SHIPPING_FROM,
  SHIPPING_DAYS,
  shippingZone,
} from "@/src/lib/shop";
import { normalizeCode, type CouponFailure } from "@/src/lib/coupons";
import {
  YAPE_DEFAULT_LIMIT,
  YAPE_MAX,
  computeTotals,
  payerIdentification,
} from "@/src/lib/checkout/order";
import OrderSummary from "./OrderSummary";
import CardFields, { type CardFieldsHandle } from "./CardFields";
import ThreeDSChallenge from "./ThreeDSChallenge";
import { createYapeToken, getDeviceId, getMercadoPago } from "./mp-client";
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
  const { items, clearCart } = useCart();
  const locale = useLocale();
  const router = useRouter();
  const ids = {
    contact: useId(),
    delivery: useId(),
    receipt: useId(),
    payment: useId(),
  };

  const [department, setDepartment] = useState("");
  const [receipt, setReceipt] = useState<Receipt>("boleta");
  const [payment, setPayment] = useState<PaymentMethod>("wallet");
  /* Los campos seguros de tarjeta se montan la primera vez que se elige tarjeta */
  const [cardOpened, setCardOpened] = useState(false);
  const cardRef = useRef<CardFieldsHandle>(null);
  /* El código de Yape es de un solo uso: se limpia si el pago falla */
  const [yapeOtp, setYapeOtp] = useState("");
  /* Cupón ingresado; si sus reglas no se cumplen, se muestra qué falta */
  const [couponCode, setCouponCode] = useState<string | null>(null);
  /* Datos del cliente que piden algunas reglas de cupones (correo, DNI/RUC,
     suscripción); se leen del formulario mientras se escribe */
  const [customer, setCustomer] = useState({
    email: "",
    document: "",
    newsletter: false,
  });
  const readCustomer = (form: HTMLFormElement) => {
    const f = new FormData(form);
    const next = {
      email: String(f.get("email") ?? ""),
      /* Solo existe el campo del comprobante elegido (DNI o RUC) */
      document: String(f.get("ruc") ?? f.get("document") ?? ""),
      newsletter: f.get("newsletter") === "on",
    };
    setCustomer((c) =>
      c.email === next.email &&
      c.document === next.document &&
      c.newsletter === next.newsletter
        ? c
        : next,
    );
  };
  /* idle → preparing (tokenizando en Mercado Pago) → charging (cobrando) */
  const [status, setStatus] = useState<"idle" | "preparing" | "charging">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  /* 3D Secure: página del banco abierta dentro del checkout */
  const [challenge, setChallenge] = useState<{
    url: string;
    creq: string;
  } | null>(null);
  const challengeCtl = useRef<{ poke(): void; cancel(): void } | null>(null);
  const pokeChallenge = useCallback(() => challengeCtl.current?.poke(), []);
  const cancelChallenge = useCallback(
    () => challengeCtl.current?.cancel(),
    [],
  );

  /* Carga Mercado Pago y su antifraude apenas se abre el checkout: el
     Device ID necesita unos segundos para generarse antes de pagar */
  useEffect(() => {
    getMercadoPago().catch(() => {});
  }, []);

  /* Totales con la misma cuenta que el servidor (cupón, envío, total) */
  const linesForTotals = items.map((i) => ({ ...i, unitPrice: i.price }));
  const totalsFor = (code: string | null) =>
    computeTotals(linesForTotals, {
      department,
      receiptType: receipt,
      payment,
      customer,
      locale,
      couponCode: code ?? undefined,
    });
  const totals = totalsFor(couponCode);
  const { shipping, total } = totals;

  /* Rechaza solo códigos inexistentes o fuera de vigencia; si falta cumplir
     una regla (monto, cantidad, factura…), el cupón queda y se indica qué falta */
  const applyCode = (code: string): CouponFailure | null => {
    const result = totalsFor(code).coupon;
    if (
      result &&
      !result.ok &&
      ["not_found", "expired", "not_started"].includes(result.reason)
    ) {
      return result;
    }
    setCouponCode(normalizeCode(code));
    return null;
  };

  const summaryProps = {
    totals,
    onApplyCode: applyCode,
    onRemoveCode: () => setCouponCode(null),
  };

  /* Tras el 3DS: consulta el pago cada 3 s hasta que se apruebe o rechace
     (el banco da ~5 min; luego el pago expira) */
  const waitForChallenge = (paymentId: string) =>
    new Promise<{ status: string; orderNumber?: string; error?: string }>(
      (resolve, reject) => {
        const deadline = Date.now() + 6 * 60_000;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let busy = false;
        const finish = () => {
          clearTimeout(timer);
          challengeCtl.current = null;
        };
        const check = async () => {
          if (busy || !challengeCtl.current) return;
          busy = true;
          clearTimeout(timer);
          try {
            const r = await fetch(`/api/checkout/status?id=${paymentId}`).then(
              (res) => res.json(),
            );
            if (r.status && r.status !== "pending") {
              finish();
              return resolve(r);
            }
          } catch {
            /* red intermitente: se reintenta */
          } finally {
            busy = false;
          }
          if (!challengeCtl.current) return;
          if (Date.now() > deadline) {
            finish();
            return reject(new Error("challenge_expired"));
          }
          timer = setTimeout(check, 3000);
        };
        challengeCtl.current = {
          poke: () => void check(),
          cancel: () => {
            finish();
            reject(new Error("challenge_cancelled"));
          },
        };
        timer = setTimeout(check, 3000);
      },
    );

  /* Mensaje legible para un código de error del servidor o de Mercado Pago */
  const errorMessage = (code: string) =>
    t.has(`errors.${code}`) ? t(`errors.${code}`) : code;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status !== "idle") return;
    setError(null);

    /* Datos del pedido: el servidor recalcula los montos con el catálogo */
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    const checkout = {
      locale,
      items: items.map(({ categoryId, productId, size, grind, qty }) => ({
        categoryId,
        productId,
        size,
        grind,
        qty,
      })),
      /* Solo se envía si sus reglas se cumplen */
      discountCode: totals.coupon?.ok ? (couponCode ?? undefined) : undefined,
      payment,
      customer: {
        email: get("email"),
        phone: get("phone"),
        firstName: get("firstName"),
        lastName: get("lastName"),
        newsletter: f.get("newsletter") === "on",
      },
      address: {
        department,
        province: get("province"),
        district: get("district"),
        address: get("address"),
        reference: get("reference"),
      },
      receipt:
        receipt === "boleta"
          ? { type: "boleta" as const, document: get("document") }
          : {
              type: "factura" as const,
              ruc: get("ruc"),
              businessName: get("businessName"),
            },
    };

    setStatus("preparing");
    try {
      /* 1. Token en Mercado Pago: los datos de la tarjeta o el código de
            Yape van directo a Mercado Pago, nunca a este servidor */
      const wallet = payment === "wallet";
      const pay = wallet
        ? {
            token: await createYapeToken(get("yapePhone"), yapeOtp),
          }
        : await cardRef.current!.tokenize(
            payerIdentification(checkout.receipt),
          );

      /* 2. Cobro en el servidor (recalcula el monto con el catálogo) */
      setStatus("charging");
      const res = await fetch("/api/checkout/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkout, ...pay, deviceId: getDeviceId() }),
      });
      let result = await res.json();

      /* El banco pide 3D Secure: el cliente confirma en el iframe */
      if (result.status === "challenge") {
        setChallenge({ url: result.url, creq: result.creq });
        try {
          result = await waitForChallenge(result.paymentId);
        } finally {
          setChallenge(null);
        }
      }

      if (result.status === "paid" || result.status === "review") {
        clearCart();
        router.push({
          pathname: "/checkout/gracias",
          query: {
            pedido: result.orderNumber,
            ...(result.status === "review" && { estado: "revision" }),
          },
        });
        return;
      }
      throw new Error(result.error || "failed");
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err.message : "server"));
      setYapeOtp("");
      setStatus("idle");
    }
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
  /* Yape tiene un tope por pago; por encima se debe pagar con tarjeta */
  const yapeOverLimit = payment === "wallet" && total > YAPE_MAX;
  /* Sobre el límite por defecto de la app, el cliente quizá deba subirlo */
  const yapeHighAmount = total > YAPE_DEFAULT_LIMIT && total <= YAPE_MAX;

  return (
    /* Columnas como Shopify: formulario (31rem) + resumen (25rem), con
       la división desplazada para que todo quede centrado con márgenes iguales */
    <div className="font-ui lg:grid lg:min-h-[calc(100svh-90px)] lg:grid-cols-[calc(50%+3rem)_minmax(0,1fr)]">
      {/* Mientras se cobra: bloquea la página para que no se cierre ni se pague dos veces */}
      {challenge && (
        <ThreeDSChallenge
          url={challenge.url}
          creq={challenge.creq}
          onComplete={pokeChallenge}
          onCancel={cancelChallenge}
        />
      )}
      {status === "charging" && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="charging-title"
          className="fixed inset-0 z-80 flex items-center justify-center bg-white/85 backdrop-blur-sm"
        >
          <div className="flex max-w-xs flex-col items-center gap-4 px-6 text-center">
            <Loader2
              size={40}
              strokeWidth={1.5}
              aria-hidden
              className="animate-spin text-[#116e78]"
            />
            <p
              id="charging-title"
              className="text-lg font-semibold text-gray-900"
            >
              {t("charging")}
            </p>
            <p className="text-sm text-gray-500">{t("chargingHint")}</p>
          </div>
        </div>
      )}
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
          onInput={(e) => readCustomer(e.currentTarget)}
          onChange={(e) => readCustomer(e.currentTarget)}
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
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[13px] text-gray-500">{t("paymentSecure")}</p>
            </div>
            <div role="radiogroup" aria-labelledby={ids.payment}>
              {(
                [
                  {
                    id: "wallet",
                    label: t("wallet"),
                    badges: ["yape"],
                  },
                  {
                    id: "card",
                    label: t("card"),
                    badges: ["visa", "mastercard", "amex", "diners"],
                  },
                ] as const
              ).map(({ id, label, badges }, i, all) => {
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
                        onChange={() => {
                          setPayment(id);
                          setError(null);
                          if (id === "card") setCardOpened(true);
                        }}
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
                        {/* En celular: 2 insignias + "+N" (como Shopify) */}
                        {badges.map((b, i) => (
                          <span
                            key={b}
                            className={
                              i >= 2 ? "hidden sm:inline-flex" : "inline-flex"
                            }
                          >
                            <PaymentBadge brand={b} />
                          </span>
                        ))}
                        {badges.length > 2 && (
                          <span className="inline-flex h-5 items-center rounded border border-gray-200 bg-white px-1.5 text-[10px] font-semibold text-gray-500 sm:hidden">
                            +{badges.length - 2}
                          </span>
                        )}
                      </span>
                    </label>

                    {/* Panel: se despliega animando la altura (0fr → 1fr) */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        active
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                      /* Inactivo: fuera del foco y de la validación */
                      inert={!active}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4 pt-1">
                          {id === "card" ? (
                            (cardOpened || active) && (
                              <CardFields ref={cardRef} />
                            )
                          ) : (
                            <div className="space-y-2.5">
                              <p className="flex items-start gap-2 text-[13px] text-gray-600">
                                <Smartphone
                                  size={16}
                                  strokeWidth={1.5}
                                  aria-hidden
                                  className="mt-0.5 shrink-0 text-[#742284]"
                                />
                                {t("yapeIntro")}
                              </p>
                              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                <Field
                                  id="co-yape-phone"
                                  name="yapePhone"
                                  type="tel"
                                  inputMode="numeric"
                                  autoComplete="tel-national"
                                  pattern="[0-9]{9}"
                                  maxLength={9}
                                  prefix="+51"
                                  label={t("yapePhone")}
                                  required={active}
                                  disabled={!active}
                                />
                                <Field
                                  id="co-yape-otp"
                                  name="yapeOtp"
                                  inputMode="numeric"
                                  autoComplete="one-time-code"
                                  pattern="[0-9]{6}"
                                  maxLength={6}
                                  label={t("yapeOtp")}
                                  value={yapeOtp}
                                  onChange={(e) =>
                                    setYapeOtp(e.target.value.replace(/\D/g, ""))
                                  }
                                  required={active}
                                  disabled={!active}
                                  className="tracking-[0.3em]"
                                />
                              </div>
                              <p className="text-xs text-gray-500">
                                {t("yapeOtpHint")}
                              </p>
                              {yapeHighAmount && (
                                <p className="text-xs text-amber-800">
                                  {t("yapeHighAmount", {
                                    amount: formatPrice(YAPE_DEFAULT_LIMIT),
                                  })}
                                </p>
                              )}
                            </div>
                          )}
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
            {yapeOverLimit && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[13px] text-amber-900">
                <AlertTriangle
                  size={16}
                  aria-hidden
                  className="mt-0.5 shrink-0"
                />
                {t("yapeLimit", { amount: formatPrice(YAPE_MAX) })}
              </p>
            )}
            <button
              type="submit"
              disabled={status !== "idle" || yapeOverLimit}
              aria-busy={status !== "idle"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#116e78] disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {status === "idle" ? (
                <Lock size={16} aria-hidden />
              ) : (
                <Loader2 size={16} aria-hidden className="animate-spin" />
              )}
              {status === "preparing"
                ? t("preparing")
                : status === "charging"
                  ? t("charging")
                  : t("pay", { amount: formatPrice(total) })}
            </button>
            <p className="text-center text-xs text-gray-500">{t("terms")}</p>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck size={13} aria-hidden />
              {t("poweredBy")}
            </p>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700"
              >
                <AlertTriangle
                  size={16}
                  aria-hidden
                  className="mt-0.5 shrink-0"
                />
                {error}
              </p>
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
