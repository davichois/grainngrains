"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShowcaseCategory } from "./types";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface HeroSliderProps {
  categories: ShowcaseCategory[];
  /** Se llama con el índice real de categoría cada vez que el slider se centra */
  onCategoryChange?: (index: number) => void;
  /** Acción del botón "abajo" (normalmente desplazar a la grilla de productos) */
  onScrollDown?: () => void;
}

/* Versión "pasiva" (translúcida) de un color hex para el contorno del texto */
function passiveColor(hex: string, alpha = 1) {
  const m = hex.replace("#", "");
  const full =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* Layout responsivo: ancho de panel (P) y "asomo" lateral (peek), en vw */
function getLayout(width: number) {
  // Móvil y tablet: panel a ancho completo, sin "asomo" lateral
  if (width < 1100) return { P: 100, peek: 0 };
  return { P: 50, peek: 25 };
}

export default function HeroSlider({
  categories,
  onCategoryChange,
  onScrollDown,
}: HeroSliderProps) {
  const t = useTranslations("editions");
  /* Pistas clonadas para el loop infinito: [últim, ...reales, primer] */
  const rendered = [
    categories[categories.length - 1],
    ...categories,
    categories[0],
  ];
  const REAL_START = 1;
  const REAL_END = categories.length; // índice de la última real
  const CLONE_END = categories.length + 1;

  const [pos, setPos] = useState(REAL_START);
  const [instant, setInstant] = useState(false);
  const [layout, setLayout] = useState({ P: 50, peek: 25 });
  const [animKey, setAnimKey] = useState(0);
  const animating = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  /* Categoría real centrada según la posición renderizada */
  const catOfPos = (p: number) =>
    (((p - REAL_START) % categories.length) + categories.length) %
    categories.length;
  const activeCat = catOfPos(pos);

  /* Layout responsivo */
  useEffect(() => {
    const apply = () => setLayout(getLayout(window.innerWidth));
    apply();
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(apply, 80);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /* Notifica el cambio de categoría al contenedor */
  useEffect(() => {
    onCategoryChange?.(activeCat);
  }, [activeCat, onCategoryChange]);

  /* Restablece la transición tras un salto instantáneo (teletransporte de clon) */
  useEffect(() => {
    if (!instant) return;
    const id = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(id);
  }, [instant]);

  const navigate = useCallback((dir: number) => {
    if (animating.current) return;
    animating.current = true;
    setPos((p) => p + dir);
    setAnimKey((k) => k + 1);
  }, []);

  const goToCategory = (cat: number) => {
    if (animating.current || cat === activeCat) return;
    navigate(cat - activeCat);
  };

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== trackRef.current || e.propertyName !== "transform") return;
    setPos((p) => {
      if (p <= 0) {
        setInstant(true);
        return REAL_END;
      }
      if (p >= CLONE_END) {
        setInstant(true);
        return REAL_START;
      }
      return p;
    });
    animating.current = false;
  };

  /* Teclado */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  /* Swipe táctil */
  const touchStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 45) navigate(dx < 0 ? 1 : -1);
    touchStart.current = null;
  };

  const { P, peek } = layout;
  const translate = -(pos * P - peek);
  /* En móvil (peek=0) las flechas van pegadas al borde; en desktop, dentro del "asomo" */
  const arrInset =
    peek === 0
      ? "10px"
      : `calc(${peek}vw - ${Math.round(
          Math.min(0.2, Math.max(18, ((peek * 1100) / 100) * 0.5)),
        )}px)`;

  const arrowBase =
    "absolute top-1/2 z-30 flex h-[clamp(36px,3.5vw,50px)] w-[clamp(36px,3.5vw,50px)] -translate-y-1/2 cursor-pointer items-center justify-center border-4 border-white bg-transparent text-[clamp(14px,1.5vw,20px)] text-white transition-colors hover:bg-white/20 max-[720px]:h-9 max-[720px]:w-9 max-[720px]:text-sm";

  return (
    <div
      className="relative h-[90vh] w-screen overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        ref={trackRef}
        onTransitionEnd={handleTransitionEnd}
        className={`flex h-full will-change-transform ${
          instant
            ? ""
            : "transition-transform duration-600 ease-[cubic-bezier(0.77,0,0.175,1)]"
        }`}
        style={{ transform: `translateX(${translate}vw)` }}
      >
        {rendered.map((cat, i) => {
          const isActive = i === pos;
          return (
            <div
              key={i}
              className="relative flex h-full shrink-0 flex-col items-center justify-center overflow-visible"
              style={{
                width: `${P}vw`,
                minWidth: `${P}vw`,
                background: cat.panelBg,
              }}
            >
              {/* Imagen de fondo opcional del panel (ajustable por categoría) */}
              {cat.panelImage && (
                <Image
                  src={cat.panelImage}
                  alt=""
                  fill
                  /* Pide siempre una fuente grande para que no se pixele al cubrir el alto */
                  sizes="100vw"
                  quality={cat.panelImageQuality ?? 90}
                  className={`pointer-events-none z-5 ${
                    cat.panelImageFit === "contain"
                      ? "object-contain"
                      : "object-cover"
                  }`}
                  style={{ objectPosition: cat.panelImagePosition ?? "center" }}
                  priority={i === pos}
                />
              )}
              <div
                key={isActive ? `bot-${animKey}` : "bot"}
                className="relative z-2 mt-[clamp(-16px,-4vw,-8px)] w-full select-none text-center text-[clamp(16px,6vw,90px)] font-black uppercase leading-[0.85] tracking-[-2px] max-[720px]:text-[clamp(32px,13vw,120px)]"
                style={{
                  color: cat.heroTextColor ?? "#f5e68a",
                  WebkitTextStroke: `2px ${passiveColor(cat.heroTextColor ?? "#f5e68a")}`,
                  paintOrder: "stroke fill",
                  ...(isActive
                    ? {
                        animation:
                          "zoomIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.16s forwards",
                      }
                    : { opacity: 0 }),
                }}
              >
                {t(`${cat.id}.bigBot`)}
              </div>

              {/* Espacio central para que la imagen de fondo respire entre los títulos */}
              <div className="relative z-3 w-full h-[clamp(10px,38vh,650px)]" />

              <div
                key={isActive ? `top-${animKey}` : "top"}
                className="relative z-2 mb-[clamp(-16px,-4vw,-8px)] w-full select-none text-center text-[clamp(22px,8vw,120px)] font-black uppercase leading-[0.85] tracking-[-2px] max-[720px]:text-[clamp(44px,17vw,150px)]"
                style={{
                  color: cat.heroTextColor ?? "#f5e68a",
                  WebkitTextStroke: `2px ${passiveColor(cat.heroTextColor ?? "#f5e68a")}`,
                  paintOrder: "stroke fill",
                  ...(isActive
                    ? {
                        animation:
                          "zoomIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.04s forwards",
                      }
                    : { opacity: 0 }),
                }}
              >
                {t("bigTop")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Flechas */}
      <button
        aria-label="Previous"
        onClick={() => navigate(-1)}
        className={`${arrowBase} max-[720px]:left-2.5`}
        style={{ left: arrInset }}
      >
        <ArrowLeft />
      </button>
      <button
        aria-label="Next"
        onClick={() => navigate(1)}
        className={`${arrowBase} max-[720px]:right-2.5`}
        style={{ right: arrInset }}
      >
        <ArrowRight />
      </button>

      {/* Botón abajo */}
      <button
        aria-label="Scroll to products"
        onClick={onScrollDown}
        className="absolute bottom-[clamp(18px,3vw,30px)] left-1/2 z-30 flex h-[clamp(38px,4vw,48px)] w-[clamp(38px,4vw,48px)] -translate-x-1/2 cursor-pointer items-center justify-center border-4 border-white bg-transparent text-[clamp(16px,1.8vw,20px)] text-white transition-colors hover:bg-white/20"
      >
        <ArrowDown />
      </button>

      {/* Puntos */}
      <div className="absolute bottom-[clamp(22px,3vw,36px)] right-[clamp(18px,4vw,56px)] z-30 flex gap-2">
        {categories.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goToCategory(i)}
            className={`h-2 w-2 cursor-pointer rounded-full transition-all duration-200 ${
              i === activeCat ? "scale-[1.3] bg-white" : "bg-white/35"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
