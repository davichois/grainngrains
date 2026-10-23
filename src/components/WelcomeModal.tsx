"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Link, usePathname } from "@/src/i18n/navigation";
import { CATEGORIES } from "@/src/components/product-showcase/data";
import { CONTACT } from "@/src/lib/site";
import { INTRO_DONE_EVENT } from "@/src/components/IntroSplash";
import { traceLink } from "@/src/components/TraceLink";

/* Tarjeta de bienvenida del inicio: sale CADA vez que se abre el home
   (a diferencia de PromoModal, que se recuerda unos días) */
const DELAY_MS = 1200;
/** Cantidad de mensajes distintos (welcome.variants en messages/*.json) */
const VARIANT_COUNT = 8;
const LAST_VARIANT_KEY = "gg-welcome-variant";
/** Mensajes que hablan de una edición: el panel arranca en ella */
const VARIANT_EDITION: Record<number, string> = { 5: "women" };

/** Mensaje al azar, distinto del que se vio la última vez */
function pickVariant() {
  let last = -1;
  try {
    last = Number(window.localStorage.getItem(LAST_VARIANT_KEY) ?? -1);
  } catch {
    /* sin almacenamiento: cualquiera vale */
  }
  let next = Math.floor(Math.random() * VARIANT_COUNT);
  if (next === last) next = (next + 1) % VARIANT_COUNT;
  try {
    window.localStorage.setItem(LAST_VARIANT_KEY, String(next));
  } catch {
    /* sin almacenamiento */
  }
  return next;
}

/** Donde no hace falta el recordatorio: ya está comprando */
const SKIP_TEASER = ["/our-coffee/products", "/checkout"];
/** Si se cierra el recordatorio, vuelve a salir pasado este tiempo */
const TEASER_AGAIN_MS = 8000;
/** Cada cuánto pasa a la siguiente edición */
const ROTATE_MS = 3200;

/** Ediciones con imagen de panel (se calcula al usarlas: el catálogo puede
 *  cambiar desde el panel) */
const editionsOf = () => CATEGORIES.filter((c) => c.panelImage);

/** Enlace que abre un correo nuevo en Gmail con destinatario, asunto y texto */
function gmailCompose(to: string, subject: string, body: string) {
  const q = { view: "cm", fs: "1", to, su: subject, body };
  /* encodeURIComponent: los espacios como %20 (con "+" Gmail los muestra tal cual) */
  const query = Object.entries(q)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `https://mail.google.com/mail/?${query}`;
}

export default function WelcomeModal() {
  const t = useTranslations("welcome");
  const tEditions = useTranslations("editions");
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  /* Al abrir, el foco va a la tarjeta (sin anillo azul en la ✕) */
  const card = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  /* Recordatorio "Compra un café" (pestaña abajo a la izquierda): queda
     activo tras la tarjeta de bienvenida o, en otras páginas, a los pocos
     segundos. Si se va (✕, tocarla, ir a comprar), vuelve a los 8 s. Nunca
     se muestra con la tarjeta abierta ni en la tienda o el checkout */
  const [armed, setArmed] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  /* Mensaje que se muestra (se elige al azar cada vez que se abre) */
  const [variant, setVariant] = useState(0);
  const onShopPage = SKIP_TEASER.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (pathname !== "/") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const open = () => {
      timer = setTimeout(() => {
        if (document.querySelector("dialog[open]")) return;
        const v = pickVariant();
        setVariant(v);
        const edition = editionsOf().findIndex(
          (c) => c.id === VARIANT_EDITION[v],
        );
        setActive(edition >= 0 ? edition : 0);
        dialog.current?.showModal();
        card.current?.focus({ preventScroll: true });
        setIsOpen(true);
      }, DELAY_MS);
    };
    /* Si la intro del inicio está corriendo, se espera a que termine */
    const intro = (window as unknown as { __ggIntro?: string }).__ggIntro;
    if (intro === "running") {
      window.addEventListener(INTRO_DONE_EVENT, open, { once: true });
    } else {
      open();
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener(INTRO_DONE_EVENT, open);
    };
  }, [pathname]);

  /* Escondida: vuelve a los 8 s, pase lo que pase */
  useEffect(() => {
    if (!snoozed) return;
    const timer = setTimeout(() => setSnoozed(false), TEASER_AGAIN_MS);
    return () => clearTimeout(timer);
  }, [snoozed]);

  /* Fuera del inicio (donde no sale la tarjeta): se activa a los 8 s de
     terminar la intro */
  useEffect(() => {
    if (armed || pathname === "/") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      timer = setTimeout(() => setArmed(true), TEASER_AGAIN_MS);
    };
    const intro = (window as unknown as { __ggIntro?: string }).__ggIntro;
    if (intro === "running") {
      window.addEventListener(INTRO_DONE_EVENT, arm, { once: true });
    } else {
      arm();
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener(INTRO_DONE_EVENT, arm);
    };
  }, [armed, pathname]);

  /* Rota las ediciones mientras está abierto (se pausa al pasar el mouse) */
  useEffect(() => {
    if (!isOpen || paused || editionsOf().length < 2) return;
    const timer = setInterval(
      () => setActive((i) => (i + 1) % editionsOf().length),
      ROTATE_MS,
    );
    return () => clearInterval(timer);
  }, [isOpen, paused]);

  /* Cierre suave: anima la salida y luego cierra */
  /** Cierra con animación y deja el recordatorio (si fue a comprar, sale
   *  a los 8 s, ya fuera de la tienda) */
  const close = useCallback((toShop = false) => {
    setArmed(true);
    if (toShop) setSnoozed(true);
    setClosing(true);
    setTimeout(() => {
      dialog.current?.close();
      setIsOpen(false);
      setClosing(false);
    }, 280);
  }, []);

  const EDITIONS = editionsOf();
  const edition = EDITIONS[active];

  return (
    <>
      <dialog
        ref={dialog}
        aria-labelledby="welcome-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => e.target === dialog.current && close()}
        className={`promo-dialog m-auto w-[calc(100%-2rem)] max-w-3xl overflow-visible lg:max-w-4xl bg-transparent p-0 font-[inherit] backdrop:bg-black/45 backdrop:backdrop-blur-[2px] ${
          closing ? "promo-closing" : ""
        }`}
      >
        <div
          ref={card}
          tabIndex={-1}
          className="relative grid outline-none max-h-[calc(100svh-2rem)] overflow-hidden bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] sm:grid-cols-[11fr_10fr]"
        >
          <button
            type="button"
            onClick={() => close()}
            aria-label={t("close")}
            className="absolute right-3 top-3 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/85 text-[#2E2E2E] outline-none backdrop-blur-sm transition-colors duration-300 hover:bg-[#2E2E2E]/8 sm:bg-transparent sm:backdrop-blur-none focus-visible:ring-2 focus-visible:ring-[#2E2E2E]"
          >
            <X size={18} />
          </button>

          {/* ── Panel de ediciones: el color, las latas y el nombre rotan ── */}
          {edition && (
            <div
              className="relative isolate h-44 overflow-hidden transition-colors duration-700 ease-out sm:h-auto sm:min-h-[21rem] lg:min-h-[26rem]"
              style={{ backgroundColor: edition.panelBg }}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {/* Nombre gigante de fondo (transparencia en el contenedor,
                el fundido en el texto) */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-[42%] -z-10 -translate-y-1/2 select-none opacity-20"
              >
                <span
                  key={`bg-${edition.id}`}
                  className="soft-fade block whitespace-nowrap text-center font-black uppercase leading-none tracking-[-0.04em]"
                  style={{
                    color: edition.headingColor ?? "#fff",
                    fontSize: "clamp(3.5rem, 8vw, 7.5rem)",
                  }}
                >
                  {tEditions(`${edition.id}.bigBot`)}
                </span>
              </span>

              {/* Latas: todas montadas; la activa aparece con fundido */}
              {EDITIONS.map((c, i) => (
                <Image
                  key={c.id}
                  src={c.panelImage!}
                  alt=""
                  fill
                  priority={i === 0}
                  /* La lata se agranda un 55% con CSS: se pide la imagen al
                   tamaño en que realmente se ve, para que salga nítida */
                  sizes="(min-width: 640px) 760px, 160vw"
                  quality={90}
                  className={`object-contain transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    i === active
                      ? "-translate-y-3 scale-[1.55] opacity-100"
                      : "pointer-events-none -translate-y-3 scale-[1.45] opacity-0"
                  }`}
                />
              ))}

              {/* Nombre de la edición + puntos para elegir */}
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <p
                  key={`name-${edition.id}`}
                  className="soft-in font-black uppercase leading-[0.9]"
                  style={{ color: edition.headingColor ?? "#fff" }}
                >
                  <span className="block text-[10px] font-bold tracking-[0.25em] opacity-80">
                    {t("edition")}
                  </span>
                  <span className="block text-xl tracking-tight sm:text-2xl lg:text-3xl">
                    {tEditions(`${edition.id}.bigBot`)}
                  </span>
                </p>
                {/* Puntos en el color de las letras de la edición: el activo es
                    una píldora que se llena mientras está en pantalla */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {EDITIONS.map((c, i) => {
                    const ink = edition.headingColor ?? "#fff";
                    const current = i === active;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActive(i)}
                        aria-label={tEditions(`${c.id}.name`)}
                        aria-current={current}
                        className={`relative h-2 cursor-pointer overflow-hidden rounded-full transition-all duration-500 ease-out ${
                          current
                            ? "w-8"
                            : "w-2 opacity-45 hover:scale-125 hover:opacity-90"
                        }`}
                        style={{
                          backgroundColor: current
                            ? `color-mix(in srgb, ${ink} 35%, transparent)`
                            : ink,
                        }}
                      >
                        {current && (
                          <span
                            key={`fill-${active}`}
                            aria-hidden
                            className="dot-fill absolute inset-y-0 left-0 w-full origin-left rounded-full"
                            style={{
                              backgroundColor: ink,
                              animationDuration: `${ROTATE_MS}ms`,
                              animationPlayState: paused ? "paused" : "running",
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Mensaje y compra ── */}
          <div className="flex flex-col justify-center overflow-y-auto p-5 sm:p-7 lg:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#787878]">
              {t.rich(`variants.${variant}.kicker`, { trace: traceLink })}
            </p>
            <h2
              id="welcome-title"
              className="mt-2 pr-8 font-black uppercase leading-[0.9] tracking-[-0.02em] text-[#2E2E2E]"
              style={{ fontSize: "clamp(1.45rem, 2.6vw, 2.4rem)" }}
            >
              {t(`variants.${variant}.title`)}{" "}
              <span className="box-decoration-clone bg-[linear-gradient(transparent_58%,#FFBE30_58%,#FFBE30_92%,transparent_92%)] px-0.5">
                {t(`variants.${variant}.titleAccent`)}
              </span>
            </h2>
            <p className="mt-3 text-sm leading-snug text-[#787878] lg:text-base lg:leading-snug">
              {t.rich(`variants.${variant}.text`, { trace: traceLink })}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href="/our-coffee/products"
                onClick={() => close(true)}
                className="group/cta inline-flex items-center gap-2 rounded-full bg-[#2E2E2E] px-6 py-2.5 text-sm lg:px-7 lg:py-3 lg:text-base font-black uppercase tracking-wide text-white transition-colors duration-500 ease-out hover:bg-[#FFBE30] hover:text-[#2E2E2E]"
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
                onClick={() => close()}
                className="cursor-pointer text-sm font-semibold text-[#787878] underline-offset-4 transition-colors hover:text-[#2E2E2E] hover:underline"
              >
                {t("later")}
              </button>
            </div>

            {/* Otra forma de apoyar: donación por correo. Abre un correo
                nuevo en Gmail, ya dirigido y escrito */}
            <p className="mt-4 border-t border-[#2E2E2E]/10 pt-3 text-[12.5px] leading-snug text-[#787878]">
              {t.rich("donation", {
                mail: () => (
                  <a
                    href={gmailCompose(
                      CONTACT.email,
                      t("donationSubject"),
                      t("donationBody"),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#2E2E2E] underline decoration-[#FFBE30] decoration-2 underline-offset-2 transition-colors hover:decoration-[#2E2E2E]"
                  >
                    {CONTACT.email}
                  </a>
                ),
              })}
            </p>
          </div>
        </div>
      </dialog>

      {/* Recordatorio tipo pestaña: abajo a la izquierda, pegado al borde de la pantalla */}
      {armed && !snoozed && !isOpen && !onShopPage && (
        <div className="teaser-in fixed bottom-0 left-4 z-40 sm:left-8">
          <div className="relative rounded-t-2xl border-2 border-b-0 border-[#2E2E2E] bg-white shadow-[0_-10px_40px_-8px_rgba(0,0,0,0.3)]">
            <Link
              href="/our-coffee/products"
              onClick={() => setSnoozed(true)}
              className="block rounded-t-[14px] px-8 py-3.5 text-center sm:px-12 text-[#2E2E2E] transition-colors duration-500 ease-out hover:bg-[#2E2E2E] hover:text-white"
            >
              <span className="block text-lg font-black uppercase leading-none tracking-tight sm:text-xl">
                {t("teaser")}
              </span>
              {/* Línea pequeña: el impacto de la compra */}
              <span className="mt-1 block text-[11px] font-medium leading-tight opacity-70">
                {t("teaserSub")}
              </span>
            </Link>
            {/* ✕ flotando sobre la pestaña, sin tocar sus esquinas */}
            <button
              type="button"
              onClick={() => setSnoozed(true)}
              aria-label={t("close")}
              className="absolute -top-10 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#2E2E2E] text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] outline-none transition-colors duration-300 hover:bg-[#3a3a3a] focus-visible:ring-2 focus-visible:ring-[#2E2E2E] focus-visible:ring-offset-2"
            >
              <X size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
