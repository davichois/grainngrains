"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { introAmp, introMono } from "@/src/lib/intro-fonts";

/** Segundos antes de llevar al inicio */
const REDIRECT_S = 10;

/* Solo negro fuerte, blanco y grises: el "&", "Error 404" y la barra
   en gris; el botón principal en blanco */
const BG = "#000000";
const INK = "#FFFFFF";
const ACCENT = "#8C8C8C";
const LINE = "#5C5C5C";

/* ───────────────────────────────────────────────────────────────
   Página 404: "4&4" con el mismo "&" de la intro, en negro, blanco y grises. Cuenta unos segundos y lleva al inicio (se puede ir
   antes con los botones). La respuesta sigue siendo 404 para Google.
─────────────────────────────────────────────────────────────── */
export default function NotFoundView() {
  const t = useTranslations("notFound");
  const router = useRouter();
  const [seconds, setSeconds] = useState(REDIRECT_S);

  useEffect(() => {
    /* Título de la pestaña (la 404 no tiene metadatos propios) */
    document.title = `${t("metaTitle")} | Grain & Grains`;
    const tick = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => {
      clearInterval(tick);
    };
  }, [t]);

  useEffect(() => {
    if (seconds === 0) router.replace("/");
  }, [seconds, router]);

  return (
    <main
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16 text-center "
      style={{ backgroundColor: BG, color: INK }}
    >
      {/* 4 & 4 */}
      <p
        aria-hidden
        className="soft-in flex items-center font-black leading-none tracking-[-0.03em]"
        style={{ fontSize: "clamp(6rem, 22vw, 16rem)" }}
      >
        <span>4</span>
        <span
          className={`${introAmp.className} amp-in mx-[0.04em] inline-block`}

          style={{ color: ACCENT }}
        >
          &amp;
        </span>
        <span>4</span>
      </p>

      <p
        className={`${introMono.className} mt-6 text-[11px] font-medium uppercase tracking-[0.2em] sm:text-xs`}
        style={{ color: ACCENT }}
      >
        {t("kicker")}
      </p>
      <h1
        className="mt-3 font-black uppercase leading-[0.95] tracking-[-0.02em]"
        style={{ fontSize: "clamp(1.9rem, 5vw, 3.25rem)" }}
      >
        {t("title")}
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed opacity-80 sm:text-lg">
        {t("text")}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full px-7 py-3 text-base font-black uppercase tracking-wide transition-transform duration-300 hover:-translate-y-0.5"
          style={{ backgroundColor: INK, color: BG }}
        >
          {t("home")}
          <ArrowRight
            size={18}
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
        <Link
          href="/our-coffee/products"
          className="inline-flex items-center rounded-full border-2 px-7 py-2.5 text-base font-bold uppercase tracking-wide transition-opacity duration-300 hover:opacity-75"
          style={{ borderColor: LINE }}
        >
          {t("shop")}
        </Link>
      </div>

      {/* Cuenta regresiva hacia el inicio, con su barra */}
      <div
        className={`${introMono.className} absolute inset-x-0 bottom-0 pb-6 text-[11px] font-medium uppercase tracking-[0.12em] sm:text-xs`}
      >
        <p aria-live="polite" className="opacity-75">
          {t("countdown", { seconds })}
        </p>
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-1 w-full origin-left transition-transform duration-1000 ease-linear"
          style={{
            backgroundColor: ACCENT,
            transform: `scaleX(${seconds / REDIRECT_S})`,
          }}
        />
      </div>
    </main>
  );
}
