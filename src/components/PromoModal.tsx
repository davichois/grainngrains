"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Leaf, Truck, X } from "lucide-react";
import { Link, usePathname } from "@/src/i18n/navigation";
import { formatPrice } from "@/src/components/cart/CartContext";
import { CATEGORIES } from "@/src/components/product-showcase/data";
import { FREE_SHIPPING_FROM } from "@/src/lib/shop";
import { INTRO_DONE_EVENT } from "@/src/components/IntroSplash";
import { traceLink } from "@/src/components/TraceLink";

/* Cuándo se muestra: unos segundos después de entrar y, una vez cerrado,
   no vuelve a salir en unos días (se recuerda en este navegador) */
const STORAGE_KEY = "gg-promo-seen";
const DELAY_MS = 3500;
const HIDE_DAYS = 3;
/** Código del cupón que se promociona (debe existir en src/lib/coupons/data.ts) */
const PROMO_CODE = "GRAIN10";
/** Páginas donde no estorba: ya está comprando */
const SKIP = ["/our-coffee/products", "/checkout"];

/** Fotos de todos los cafés del catálogo (se actualiza solo al agregar uno) */
const ALL_COFFEES = CATEGORIES.flatMap((c) =>
  c.products.flatMap((p) => (p.image ? [p.image] : [])),
);

/** Precio más bajo del catálogo (bolsa de 250 g) */
const FROM_PRICE = Math.min(
  ...CATEGORIES.flatMap((c) => c.products.map((p) => p.prices["250g"])),
);

function recentlySeen() {
  try {
    const at = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
    return Date.now() - at < HIDE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* sin almacenamiento: se volverá a mostrar, no pasa nada */
  }
}

/** Modal de bienvenida que invita a comprar café */
export default function PromoModal() {
  const t = useTranslations("promo");
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  /* Al abrir, el foco va a la tarjeta (sin anillo azul en la ✕) */
  const card = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState(false);

  /* Abre tras unos segundos, salvo que se haya visto hace poco */
  useEffect(() => {
    /* En el inicio sale WelcomeModal; aquí no, para no juntar dos modales */
    if (
      pathname === "/" ||
      SKIP.some((p) => pathname.startsWith(p)) ||
      recentlySeen()
    )
      return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const open = () => {
      timer = setTimeout(() => {
        if (document.querySelector("dialog[open]")) return;
        dialog.current?.showModal();
        card.current?.focus({ preventScroll: true });
      }, DELAY_MS);
    };
    /* Si la intro está corriendo, se espera a que termine */
    if ((window as unknown as { __ggIntro?: string }).__ggIntro === "running") {
      window.addEventListener(INTRO_DONE_EVENT, open, { once: true });
    } else {
      open();
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener(INTRO_DONE_EVENT, open);
    };
  }, [pathname]);

  /* Cierre suave: primero anima la salida y luego cierra el diálogo */
  const close = useCallback(() => {
    markSeen();
    setClosing(true);
    setTimeout(() => {
      dialog.current?.close();
      setClosing(false);
    }, 280);
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el portapapeles puede no estar disponible */
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="promo-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      /* Clic fuera de la tarjeta (en el fondo) cierra */
      onClick={(e) => e.target === dialog.current && close()}
      className={`promo-dialog m-auto w-[calc(100%-2rem)] max-w-3xl overflow-visible bg-transparent p-0 font-[inherit] backdrop:bg-black/45 backdrop:backdrop-blur-[2px] ${
        closing ? "promo-closing" : ""
      }`}
    >
      <div
        ref={card}
        tabIndex={-1}
        className="relative grid outline-none overflow-hidden bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] sm:grid-cols-[5fr_6fr]"
      >
        <button
          type="button"
          onClick={close}
          aria-label={t("close")}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/85 text-[#1E1E1E] outline-none backdrop-blur-sm transition-colors duration-300 hover:bg-[#1E1E1E]/8 sm:bg-transparent sm:backdrop-blur-none focus-visible:ring-2 focus-visible:ring-[#1E1E1E]"
        >
          <X size={18} />
        </button>

        {/* Mosaico con todos los cafés del catálogo */}
        <div className="relative">
          <ul
            aria-hidden
            className="grid h-full grid-cols-4 grid-rows-2 sm:grid-cols-2 sm:grid-rows-4"
          >
            {ALL_COFFEES.map((src) => (
              <li
                key={src}
                className="relative aspect-square overflow-hidden sm:aspect-auto"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 260px, 40vw"
                  quality={90}
                  className="scale-[1.18] object-cover"
                />
              </li>
            ))}
          </ul>
          <span className="absolute bottom-3 left-3 rounded-full bg-[#1E1E1E] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#FFBE30]">
            {t("badge", { count: ALL_COFFEES.length })}
          </span>
        </div>

        {/* Mensaje */}
        <div className="p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#787878]">
            {t("kicker")}
          </p>
          <h2
            id="promo-title"
            className="mt-2 font-black uppercase leading-[0.95] tracking-[-0.02em] text-[#1E1E1E]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            {t("title")}{" "}
            <span className="box-decoration-clone bg-[linear-gradient(transparent_58%,#FFBE30_58%,#FFBE30_92%,transparent_92%)] px-0.5">
              {t("titleAccent")}
            </span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#787878]">
            {t.rich("text", {
              price: formatPrice(FROM_PRICE),
              trace: traceLink,
            })}
          </p>

          <ul className="mt-4 space-y-1.5 text-sm text-[#1E1E1E]">
            <li className="flex items-center gap-2">
              <Truck size={16} aria-hidden className="shrink-0" />
              {t("perkShipping", { amount: formatPrice(FREE_SHIPPING_FROM) })}
            </li>
            <li className="flex items-center gap-2">
              <Leaf size={16} aria-hidden className="shrink-0" />
              {t("perkOrigin")}
            </li>
          </ul>

          {/* Código de descuento con botón para copiar */}
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-[#1E1E1E]/30 bg-[#FFBE30]/15 px-4 py-2.5">
            <p className="text-[13px] leading-snug text-[#1E1E1E]">
              {t.rich("coupon", {
                code: () => (
                  <strong className="font-black tracking-wider">
                    {PROMO_CODE}
                  </strong>
                ),
              })}
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#1E1E1E] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1E1E1E] transition-colors duration-300 hover:bg-[#FFBE30]"
            >
              {copied ? (
                <Check size={13} aria-hidden />
              ) : (
                <Copy size={13} aria-hidden />
              )}
              {copied ? t("copied") : t("copy")}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/our-coffee/products"
              onClick={close}
              className="group/cta inline-flex items-center gap-2 rounded-full bg-[#1E1E1E] px-7 py-3 text-base font-black uppercase tracking-wide text-white transition-colors duration-500 ease-out hover:bg-[#FFBE30] hover:text-[#1E1E1E]"
            >
              {t("cta")}
              <span
                aria-hidden
                className="transition-transform duration-500 ease-out group-hover/cta:translate-x-1"
              >
                →
              </span>
            </Link>
            <button
              type="button"
              onClick={close}
              className="cursor-pointer text-sm font-semibold text-[#787878] underline-offset-4 transition-colors hover:text-[#1E1E1E] hover:underline"
            >
              {t("later")}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
