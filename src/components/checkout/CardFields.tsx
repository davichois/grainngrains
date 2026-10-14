"use client";

import { useTranslations } from "next-intl";
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { CircleAlert, Lock } from "lucide-react";
import {
  getMercadoPago,
  type PaymentMethodInfo,
  type SecureField,
  type SecureFieldType,
} from "./mp-client";
import { Field, PaymentBadge } from "./fields";

/** Lo que el formulario necesita para cobrar con tarjeta */
export interface CardPayment {
  token: string;
  paymentMethodId: string;
  issuerId?: number;
}

export interface CardFieldsHandle {
  /** Valida y tokeniza la tarjeta; lanza Error("card_invalid") si falta algo */
  tokenize(identification: {
    type: string;
    number: string;
  }): Promise<CardPayment>;
}

type FieldState = { focused: boolean; invalid: boolean; touched: boolean };

const SECURE_FIELDS: SecureFieldType[] = [
  "cardNumber",
  "expirationDate",
  "securityCode",
];

/* Estilo del texto dentro de los iframes de Mercado Pago: igual que
   nuestros campos (Montserrat 14px, gris 900) */
const IFRAME_STYLE = {
  fontFamily: "Montserrat, Arial, sans-serif",
  fontSize: "14px",
  color: "#111827",
  placeholderColor: "#9ca3af",
  height: "20px",
  padding: "0",
};
const IFRAME_FONTS = [
  {
    src: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500&display=swap",
  },
];

/* Marca detectada por Mercado Pago → insignia propia */
const BADGE: Record<string, "visa" | "mastercard" | "amex" | "diners"> = {
  visa: "visa",
  debvisa: "visa",
  master: "mastercard",
  debmaster: "mastercard",
  amex: "amex",
  diners: "diners",
};

/**
 * Datos de tarjeta con Secure Fields: número, vencimiento y CVV se escriben
 * en iframes de Mercado Pago montados dentro de cajas con nuestro diseño.
 */
export default function CardFields({
  ref,
}: {
  ref: Ref<CardFieldsHandle>;
}) {
  const t = useTranslations("checkout");
  const fields = useRef<Partial<Record<SecureFieldType, SecureField>>>({});
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [state, setState] = useState<Record<SecureFieldType, FieldState>>(
    () =>
      Object.fromEntries(
        SECURE_FIELDS.map((f) => [
          f,
          { focused: false, invalid: false, touched: false },
        ]),
      ) as Record<SecureFieldType, FieldState>,
  );
  const [bin, setBin] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethodInfo | null>(null);
  const [issuerId, setIssuerId] = useState<number | undefined>();
  const [holder, setHolder] = useState("");

  const patch = (f: SecureFieldType, p: Partial<FieldState>) =>
    setState((s) => ({ ...s, [f]: { ...s[f], ...p } }));

  /* Monta los tres iframes (una vez; se desmontan al salir) */
  useEffect(() => {
    let cancelled = false;
    const mounted: SecureField[] = [];
    getMercadoPago()
      .then((mp) => {
        if (cancelled) return;
        const placeholders: Record<SecureFieldType, string> = {
          cardNumber: "1234 1234 1234 1234",
          expirationDate: t("expiryPlaceholder"),
          securityCode: "123",
        };
        let pending = SECURE_FIELDS.length;
        for (const type of SECURE_FIELDS) {
          const field = mp.fields
            .create(type, {
              placeholder: placeholders[type],
              style: IFRAME_STYLE,
              customFonts: IFRAME_FONTS,
              srLabel: t(`cardFields.${type}`),
              ariaRequired: true,
              ...(type === "expirationDate" && { mode: "short" }),
            })
            .mount(`mp-${type}`);
          field.on("ready", () => {
            if (--pending === 0 && !cancelled) setReady(true);
          });
          field.on("focus", () => patch(type, { focused: true }));
          field.on("blur", () =>
            patch(type, { focused: false, touched: true }),
          );
          field.on("validityChange", (e) =>
            patch(type, {
              invalid: Array.isArray(e.errorMessages)
                ? e.errorMessages.length > 0
                : false,
            }),
          );
          if (type === "cardNumber") {
            field.on("binChange", (e) => {
              const next = typeof e.bin === "string" ? e.bin : null;
              setBin(next);
              /* Número borrado o inválido: se olvida la marca detectada */
              if (!next) {
                setMethod(null);
                setIssuerId(undefined);
              }
            });
          }
          fields.current[type] = field;
          mounted.push(field);
        }
      })
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
      mounted.forEach((f) => f.unmount());
      fields.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- montar una sola vez
  }, []);

  /* Con los primeros dígitos: marca, banco y largo del CVV */
  useEffect(() => {
    if (!bin) return;
    let cancelled = false;
    (async () => {
      const mp = await getMercadoPago();
      const { results } = await mp.getPaymentMethods({ bin });
      const pm = results[0];
      if (cancelled || !pm) return;
      setMethod(pm);
      const settings = pm.settings?.[0];
      if (settings?.security_code) {
        fields.current.securityCode?.update({
          settings: settings.security_code,
        });
      }
      if (settings?.card_number) {
        fields.current.cardNumber?.update({ settings: settings.card_number });
      }
      if (pm.additional_info_needed?.includes("issuer_id")) {
        const issuers = await mp.getIssuers({ paymentMethodId: pm.id, bin });
        if (!cancelled) setIssuerId(issuers[0]?.id);
      } else {
        setIssuerId(pm.issuer?.id);
      }
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bin]);

  useImperativeHandle(ref, () => ({
    async tokenize(identification) {
      /* Marca todos como tocados para mostrar los errores pendientes */
      setState((s) => {
        const next = { ...s };
        for (const f of SECURE_FIELDS) next[f] = { ...s[f], touched: true };
        return next;
      });
      if (!ready || !method || !holder.trim()) throw new Error("card_invalid");
      if (SECURE_FIELDS.some((f) => state[f].invalid)) {
        throw new Error("card_invalid");
      }
      const mp = await getMercadoPago();
      let token: { id: string } | undefined;
      try {
        token = await mp.fields.createCardToken({
          cardholderName: holder.trim(),
          identificationType: identification.type,
          identificationNumber: identification.number,
        });
      } catch {
        throw new Error("card_invalid");
      }
      if (!token?.id) throw new Error("card_invalid");
      return {
        token: token.id,
        paymentMethodId: method.id,
        issuerId,
      };
    },
  }));

  const box = (f: SecureFieldType) => {
    const s = state[f];
    const showError = s.invalid && s.touched && !s.focused;
    return `relative rounded-xl border bg-white px-3 pb-1.5 pt-5 transition-colors ${
      showError
        ? "border-red-500 ring-1 ring-inset ring-red-500"
        : s.focused
          ? "border-gray-900 ring-1 ring-inset ring-gray-900"
          : "border-gray-300"
    }`;
  };

  const secureField = (f: SecureFieldType, suffix?: React.ReactNode) => {
    const s = state[f];
    const showError = s.invalid && s.touched && !s.focused;
    return (
      <div>
        <div className={box(f)}>
          {/* Etiqueta fija arriba: el texto lo escribe el iframe */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-2 text-[11px] text-gray-500"
          >
            {t(`cardFields.${f}`)}
          </span>
          <div
            id={`mp-${f}`}
            className={`h-5 ${suffix ? "pr-14" : ""} ${ready ? "" : "animate-pulse rounded bg-gray-100"}`}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
              {suffix}
            </span>
          )}
        </div>
        {showError && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
            <CircleAlert size={14} aria-hidden className="shrink-0" />
            {t(`cardErrors.${f}`)}
          </p>
        )}
      </div>
    );
  };

  const brand = method ? BADGE[method.id] : undefined;

  if (loadError) {
    return (
      <p
        role="alert"
        className="rounded-xl bg-white px-3.5 py-3 text-[13px] text-red-700 ring-1 ring-red-200"
      >
        {t("errors.mp_unavailable")}
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {secureField(
        "cardNumber",
        brand ? (
          <PaymentBadge brand={brand} />
        ) : method?.secure_thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo remoto de Mercado Pago
          <img src={method.secure_thumbnail} alt={method.name} className="h-5" />
        ) : (
          <Lock size={15} aria-hidden className="text-gray-400" />
        ),
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {secureField("expirationDate")}
        {secureField("securityCode")}
      </div>
      <Field
        id="co-card-holder"
        name="cardholderName"
        autoComplete="cc-name"
        label={t("cardFields.holder")}
        value={holder}
        onChange={(e) => setHolder(e.target.value)}
        required
      />
    </div>
  );
}
