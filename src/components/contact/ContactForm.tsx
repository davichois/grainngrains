"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState, type InputHTMLAttributes } from "react";
import { AlertTriangle, ChevronDown, Loader2 } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { INQUIRY_TYPES, isQuote, type InquiryType } from "@/src/lib/contact";

const INK = "#1E1E1E";

/* Etiqueta en mayúsculas espaciadas (como "GRAIN & GRAINS" en trazabilidad) */
const labelCls =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#787878]";

/* Caja cuadrada con borde teal, como el buscador de trazabilidad */
const boxCls =
  "w-full rounded-2xl border-2 border-[#1E1E1E]/15 bg-white px-4 py-2 text-[15px] font-medium text-gray-900 outline-none transition-[border-color,box-shadow,background-color] duration-300 ease-out placeholder:font-normal placeholder:text-gray-400 hover:border-[#1E1E1E]/40 focus:border-[#1E1E1E] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,190,48,0.28)] user-invalid:border-red-600";

function SquareField({
  id,
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={boxCls}
        {...props}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Tarjeta cuadrada con franja amarilla y sombra sólida (como un sello) */
function Card({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border-2 border-[#1E1E1E] bg-white">
      <div className="flex items-center justify-between gap-3 border-b-2 border-[#1E1E1E] bg-[#FFBE30] px-5 py-4 sm:px-7">
        <p className="text-xl font-black uppercase tracking-tight text-[#1E1E1E] sm:text-2xl">
          {title}
        </p>
        {aside && (
          <p className="text-right hidden whitespace-nowrap rounded-full bg-[#1E1E1E] px-3 py-1 text-[10px] sm:block font-bold uppercase tracking-[0.15em] text-[#FFBE30]">
            {aside}
          </p>
        )}
      </div>
      <div className="p-5 sm:px-7 sm:py-6">{children}</div>
    </div>
  );
}

/** Formulario de contacto / cotización: se envía al correo de la tienda */
export default function ContactForm({
  initialType = "general",
}: {
  initialType?: InquiryType;
}) {
  const t = useTranslations("contact");
  const locale = useLocale();
  const ids = { type: useId(), message: useId() };
  const [type, setType] = useState<InquiryType>(initialType);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  /* Momento en que se abrió el formulario (los bots envían al instante) */
  const [startedAt] = useState(() => Date.now());
  const quote = isQuote(type);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    setError(null);
    setStatus("sending");
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: get("name"),
          email: get("email"),
          phone: get("phone"),
          company: get("company"),
          country: get("country"),
          volume: get("volume"),
          message: get("message"),
          consent: f.get("consent") === "on",
          website: get("website"),
          startedAt,
          locale,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "server");
      setStatus("sent");
    } catch (err) {
      const code = err instanceof Error ? err.message : "server";
      setError(
        t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.server"),
      );
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <Card title={t("formHeading")}>
        <div role="status" className="soft-in py-8 text-center">
          <p
            className="font-black uppercase leading-[0.9] tracking-[-0.02em] text-[#1E1E1E]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            {t("success.title")}
          </p>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">
            {t("success.text")}
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-8 inline-block cursor-pointer rounded-full border-2 border-[#1E1E1E] px-6 py-2 text-sm font-semibold uppercase tracking-wide text-[#1E1E1E] transition-colors duration-500 ease-out hover:bg-[#1E1E1E] hover:text-white"
          >
            {t("success.again")}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card title={t("formHeading")} aside={t("cardAside")}>
      <form onSubmit={submit} className="space-y-5">
        {/* Tipo de consulta: menú desplegable con el estilo de los campos */}
        <div>
          <label htmlFor={ids.type} className={labelCls}>
            {t("typeLabel")}
          </label>
          <div className="relative">
            <select
              id={ids.type}
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as InquiryType)}
              className={`${boxCls} cursor-pointer appearance-none pr-10 font-semibold`}
            >
              {INQUIRY_TYPES.map((it) => (
                <option key={it} value={it}>
                  {t(`types.${it}`)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              aria-hidden
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1E1E1E]"
            />
          </div>
        </div>

        {/* Fila 1: nombre, correo y celular · Fila 2 (cotización): empresa,
            país y volumen · luego el mensaje a lo ancho */}
        <div className="grid items-end gap-4 sm:grid-cols-3">
          <SquareField
            id="ct-name"
            name="name"
            autoComplete="name"
            label={t("fields.name")}
            required
            maxLength={100}
          />
          <SquareField
            id="ct-email"
            name="email"
            type="email"
            autoComplete="email"
            label={t("fields.email")}
            required
            maxLength={120}
          />
          <SquareField
            id="ct-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            label={t("fields.phone")}
            maxLength={30}
          />
          {/* Campos de cotización: se despliegan/recogen animando la altura
              (0fr ↔ 1fr) y la opacidad; ocultos quedan inertes y no se envían */}
          <div
            className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:col-span-3 ${
              quote
                ? "grid-rows-[1fr] opacity-100"
                : "-mt-4 grid-rows-[0fr] opacity-0"
            }`}
            inert={!quote}
          >
            <div className="overflow-hidden">
              <div className="grid items-end gap-4 sm:grid-cols-3">
                <SquareField
                  id="ct-company"
                  name="company"
                  autoComplete="organization"
                  label={t("fields.company")}
                  maxLength={120}
                  disabled={!quote}
                />
                <SquareField
                  id="ct-country"
                  name="country"
                  autoComplete="country-name"
                  label={t("fields.country")}
                  maxLength={60}
                  disabled={!quote}
                />
                <SquareField
                  id="ct-volume"
                  name="volume"
                  label={t("fields.volume")}
                  placeholder={
                    isQuote(type)
                      ? t(
                          `volumeHint.${type as Exclude<InquiryType, "general">}`,
                        )
                      : ""
                  }
                  maxLength={80}
                  disabled={!quote}
                />
              </div>
            </div>
          </div>
          <div className="sm:col-span-3">
            <label htmlFor={ids.message} className={labelCls}>
              <span key={quote ? "q" : "g"} className="soft-fade">
                {quote ? t("fields.messageQuote") : t("fields.message")}
              </span>
            </label>
            <textarea
              id={ids.message}
              name="message"
              required
              minLength={10}
              maxLength={3000}
              rows={3}
              className={`${boxCls} block resize-y`}
            />
          </div>
        </div>

        {/* Campo trampa para bots: invisible para personas */}
        <div
          aria-hidden
          className="absolute -left-2499.75 h-0 w-0 overflow-hidden"
        >
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="soft-fade flex items-start gap-2 rounded-2xl border-2 border-red-600 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-start gap-3 text-[13px] leading-snug text-gray-600 sm:max-w-[55%]">
            <input
              type="checkbox"
              name="consent"
              required
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border-2 border-[#1E1E1E] bg-white bg-center bg-no-repeat checked:bg-[#1E1E1E] checked:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22%20fill=%22white%22><path%20d=%22M6.2%2011.4%203%208.2l1.1-1.1%202.1%202.1%205.6-5.6L12.9%204.7z%22/></svg>')] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E1E1E]"
            />
            <span>
              {t.rich("consent", {
                privacy: (chunks) => (
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-semibold text-[#1E1E1E] underline decoration-[#FFBE30] decoration-2 underline-offset-2"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>

          {/* Envío: como el botón "RASTREAR" de trazabilidad */}
          <button
            type="submit"
            disabled={status === "sending"}
            style={{ borderColor: INK }}
            className="group/btn inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border-4 bg-[#1E1E1E] px-8 py-3 text-base font-black uppercase tracking-wide text-white transition-colors duration-500 ease-out hover:bg-[#FFBE30] hover:text-[#1E1E1E] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            {status === "sending" && (
              <Loader2 size={18} aria-hidden className="animate-spin" />
            )}
            {status === "sending"
              ? t("sending")
              : quote
                ? t("submitQuote")
                : t("submit")}
            {status !== "sending" && (
              <span
                aria-hidden
                className="transition-transform duration-500 ease-out group-hover/btn:translate-x-1"
              >
                →
              </span>
            )}
          </button>
        </div>
      </form>
    </Card>
  );
}
