"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { PRODUCER_NAMES, shuffledProducers } from "@/src/content/producers";
import {
  INTRO_DEFAULT_PALETTE,
  pickIntroPalette,
  type IntroPalette,
} from "@/src/content/intro-palettes";
import { introAmp, introHand, introMono } from "@/src/lib/intro-fonts";
import { traceLink } from "@/src/components/TraceLink";

/* ───────────────────────────────────────────────────────────────
   Intro de la web (inspirada en noth.in). G&G se abre y por el hueco
   del "&" pasan los nombres de más de 1 500 caficultores con su origen
   —primero despacio, luego como un torrente— mientras un contador los
   suma. Al final el hueco vuelve a ser "&": Grain & Grains son todos
   ellos. Para salir se entra por el "&", que se vuelve una ventana a la
   página.
   - Los colores salen de una de las latas, al azar (src/content/intro-palettes.ts).
   - Sale cada vez que se entra a la web (está en el layout: al navegar
     dentro del sitio no se repite). Se puede saltar.
   - Las tarjetas (WelcomeModal, PromoModal) esperan a que termine.
─────────────────────────────────────────────────────────────── */

/** Evento que avisa que la intro terminó */
export const INTRO_DONE_EVENT = "gg:intro-done";

/* Línea de tiempo (ms): 4,9 s de intro (2,4 s de cierre para leer) + 1,8 s de salida por el "&" */
const SHOW_LOGO = 300;
const OPEN = 600;
const NAMES_START = 750;
/** Cada nombre se queda lo justo para leerse (no hace falta mostrarlos todos) */
const NAME_MS = 330;
/** Cuánto duran los nombres pasando */
const NAMES_MS = 1750;
const NAMES_END = NAMES_START + NAMES_MS;
/** El cierre se queda quieto para leerlo con calma */
const HOLD_MS = 2400;
/** Salida: zoom entrando por el "&" hasta mostrar la página */
const FADE_MS = 1800;
/** Dentro de la salida: primero se abren las G y luego el "&" es ventana */
const PORTAL_AT = FADE_MS * 0.22;

const TOTAL = PRODUCER_NAMES.length;

type Phase = "start" | "logo" | "open" | "closed" | "out" | "gone";

/** El "&" hecho ventana: dónde y de qué tamaño se dibuja en el recorte */
interface Portal {
  /** Centro del "&" en pantalla */
  x: number;
  /** Línea base del "&" en pantalla */
  baseline: number;
  /** Tamaño de letra en px */
  size: number;
}

/** Nombre que se ve en el instante `ms`: uno cada NAME_MS, legible */
function nameIndexAt(ms: number) {
  const t = Math.max(0, ms - NAMES_START);
  return Math.min(Math.floor(t / NAME_MS), TOTAL - 1);
}

/** El contador sí recorre a todos los caficultores (rápido, con aceleración) */
function countAt(ms: number) {
  const p = Math.min(Math.max(0, ms - NAMES_START) / NAMES_MS, 1);
  return Math.max(1, Math.round(TOTAL * p * p));
}

const ampFont = (size: number) =>
  `italic 900 ${size}px ${introAmp.style.fontFamily}`;

/** Medidas verticales de la letra del "&" (las mismas que usa el navegador) */
function ampMetrics(size: number) {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return { ascent: size * 0.8, descent: size * 0.2 };
  ctx.font = ampFont(size);
  const m = ctx.measureText("&");
  return { ascent: m.fontBoundingBoxAscent, descent: m.fontBoundingBoxDescent };
}

/** Punto del trazo del "&" donde hacer el zoom: el más grueso cerca del
 *  centro, para que al entrar la pantalla se llene de página. Devuelve la
 *  distancia desde el centro/línea base del "&" */
function strokeTarget(size: number) {
  const { ascent, descent } = ampMetrics(size);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { dx: 0, dy: 0 };
  ctx.font = ampFont(size);
  const W = Math.ceil(ctx.measureText("&").width + size * 0.4);
  const H = Math.ceil(ascent + descent);
  canvas.width = W;
  canvas.height = H;
  ctx.font = ampFont(size);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("&", W / 2, ascent);
  const data = ctx.getImageData(0, 0, W, H).data;

  /* Distancia de cada punto del trazo a su borde (dos pasadas) */
  const dist = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) dist[i] = data[i * 4 + 3] > 128 ? 1e6 : 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!dist[i]) continue;
      const up = y ? dist[i - W] : 0;
      const left = x ? dist[i - 1] : 0;
      dist[i] = Math.min(dist[i], up + 1, left + 1);
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (!dist[i]) continue;
      const down = y < H - 1 ? dist[i + W] : 0;
      const right = x < W - 1 ? dist[i + 1] : 0;
      dist[i] = Math.min(dist[i], down + 1, right + 1);
    }

  /* El más grueso, sin alejarse mucho del centro */
  const cx = W / 2;
  const cy = H / 2;
  let best = { score: -Infinity, x: cx, y: cy };
  for (let y = 0; y < H; y += 2)
    for (let x = 0; x < W; x += 2) {
      const d = dist[y * W + x];
      if (!d) continue;
      const score = d - 0.12 * Math.hypot(x - cx, y - cy);
      if (score > best.score) best = { score, x, y };
    }
  return { dx: best.x - cx, dy: best.y - ascent };
}

/** Salida "por el &" (primera parte): las G se abren como puertas, el "&"
 *  toma impulso y la página llega desde un poco más cerca hasta su sitio.
 *  La segunda parte (el zoom dentro del "&") la hace el recorte en SVG */
function playExit(
  root: HTMLElement | null,
  logo: HTMLElement | null,
  glyph: HTMLElement | null,
  gs: (HTMLElement | null)[],
) {
  if (!root || !logo || !glyph) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: FADE_MS / 3,
      fill: "forwards",
    });
    return;
  }

  /* Impulso: todo se encoge un poco alrededor del "&" */
  const box = logo.getBoundingClientRect();
  const g = glyph.getBoundingClientRect();
  logo.style.transformOrigin = `${g.left + g.width / 2 - box.left}px ${g.top + g.height / 2 - box.top}px`;
  logo.animate(
    [{ transform: "none" }, { transform: "scale(0.86) rotate(-2deg)" }],
    {
      duration: PORTAL_AT,
      easing: "cubic-bezier(0.33, 1, 0.68, 1)",
      fill: "forwards",
    },
  );

  /* Las G se abren hacia los lados (en celular, arriba y abajo) y se apagan */
  const row = getComputedStyle(logo).flexDirection === "row";
  gs.forEach((el, i) => {
    const dir = i === 0 ? -1 : 1;
    el?.animate(
      [
        { transform: "none", opacity: 1 },
        {
          transform: row
            ? `translateX(${dir * 0.6}em)`
            : `translateY(${dir * 0.6}em)`,
          opacity: 0,
        },
      ],
      {
        duration: PORTAL_AT,
        easing: "cubic-bezier(0.5, 0, 0.75, 0)",
        fill: "forwards",
      },
    );
  });

  /* Lo que queda del fondo se va al final */
  root.animate([{ opacity: 1 }, { opacity: 1, offset: 0.72 }, { opacity: 0 }], {
    duration: FADE_MS,
    easing: "ease-out",
    fill: "forwards",
  });

  /* La página llega desde un poco más cerca y se asienta (zoom continuo) */
  const page = Array.from(root.parentElement?.children ?? []).filter(
    (el): el is HTMLElement => el !== root && el instanceof HTMLElement,
  );
  for (const el of page) {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    el.style.transformOrigin = `${window.innerWidth / 2 - r.left}px ${window.innerHeight / 2 - r.top}px`;
    const settle = el.animate(
      [
        { transform: "scale(1.18)" },
        { transform: "scale(1.18)", offset: 0.35 },
        { transform: "none" },
      ],
      {
        duration: FADE_MS,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
    /* Al terminar, la página queda tal cual estaba */
    settle.onfinish = () => el.style.removeProperty("transform-origin");
  }
}

export default function IntroSplash() {
  const t = useTranslations("intro");
  const locale = useLocale();
  const [phase, setPhase] = useState<Phase>("start");
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(1);
  /* Colores de una lata al azar (se elige al montar: en el servidor no hay azar) */
  const [palette, setPalette] = useState<IntroPalette>(INTRO_DEFAULT_PALETTE);
  /* Caficultores reales primero, en otro orden en cada visita (al montar) */
  const [producers, setProducers] = useState(PRODUCER_NAMES);
  const timers = useRef<number[]>([]);
  /* Para la salida: se entra por el "&" */
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const glyph = useRef<HTMLSpanElement>(null);
  const gs = useRef<(HTMLSpanElement | null)[]>([]);
  const portalText = useRef<SVGTextElement>(null);
  /* El "&" ya es ventana hacia la página */
  const [portal, setPortal] = useState<Portal | null>(null);

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("out");
    playExit(root.current, logo.current, glyph.current, gs.current);
    timers.current.push(
      window.setTimeout(() => {
        const el = glyph.current;
        if (
          !el ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        /* Mismo lugar y tamaño que el "&" en pantalla (ya encogido) */
        const r = el.getBoundingClientRect();
        const size = parseFloat(getComputedStyle(el).fontSize) * 0.86;
        const { ascent, descent } = ampMetrics(size);
        setPortal({
          x: r.left + r.width / 2,
          baseline: r.top + r.height / 2 + (ascent - descent) / 2,
          size,
        });
      }, PORTAL_AT),
    );
    timers.current.push(
      window.setTimeout(() => {
        setPhase("gone");
        document.documentElement.style.overflow = "";
        (window as unknown as { __ggIntro?: string }).__ggIntro = "done";
        window.dispatchEvent(new Event(INTRO_DONE_EVENT));
      }, FADE_MS),
    );
  }, []);

  /* Zoom dentro del "&": desde su punto más grueso, acelerando y girando
     apenas, hasta que la pantalla entera es página */
  useEffect(() => {
    const text = portalText.current;
    if (!portal || !text) return;
    const { dx, dy } = strokeTarget(portal.size);
    text.style.transformBox = "view-box";
    text.style.transformOrigin = `${portal.x + dx}px ${portal.baseline + dy}px`;
    text.animate(
      [
        { transform: "rotate(-2deg)" },
        { transform: "scale(140) rotate(8deg)" },
      ],
      {
        duration: FADE_MS * 0.85 - PORTAL_AT,
        easing: "cubic-bezier(0.7, 0, 0.84, 0)",
        fill: "forwards",
      },
    );
  }, [portal]);

  useEffect(() => {
    const w = window as unknown as { __ggIntro?: string };
    const at = (ms: number, fn: () => void) =>
      timers.current.push(window.setTimeout(fn, ms));

    /* Avisa a las tarjetas (WelcomeModal, PromoModal) que esperen: este
       efecto corre antes que los suyos porque la intro va primero en el layout */
    w.__ggIntro = "running";
    document.documentElement.style.overflow = "hidden";
    at(0, () => {
      setPalette(pickIntroPalette());
      setProducers(shuffledProducers());
    });
    at(SHOW_LOGO, () => setPhase("logo"));
    at(OPEN, () => setPhase("open"));
    at(NAMES_END, () => setPhase("closed"));
    at(NAMES_END + HOLD_MS, finish);

    /* Nombres y contador, cuadro a cuadro */
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const ms = now - start;
      setIndex(nameIndexAt(ms));
      setCount(countAt(ms));
      if (ms < NAMES_END) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      document.documentElement.style.overflow = "";
    };
  }, [finish]);

  if (phase === "gone") return null;

  const open = phase === "open";
  const closed = phase === "closed" || phase === "out";
  const out = phase === "out";
  const producer = producers[index];
  const fmt = new Intl.NumberFormat(locale);
  /* Cifra redonda para el cierre: "+1 600" */
  const rounded = fmt.format(Math.floor(TOTAL / 100) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("aria")}
      ref={root}
      className={`fixed inset-0 z-100 flex select-none items-center justify-center overflow-hidden ${
        out ? "pointer-events-none" : ""
      }`}
      /* Con el "&" hecho ventana, el fondo lo pone el recorte en SVG */
      style={
        {
          backgroundColor: portal ? "transparent" : palette.bg,
          color: palette.ink,
          transition: "background-color 300ms ease-out, color 300ms ease-out",
          "--intro-accent": palette.accent,
        } as React.CSSProperties
      }
    >
      {/* El fondo con el "&" recortado: por el agujero se ve la página */}
      {portal && (
        <svg aria-hidden className="absolute inset-0 h-full w-full">
          <defs>
            <mask id="gg-intro-amp">
              <rect width="100%" height="100%" fill="#fff" />
              <text
                ref={portalText}
                x={portal.x}
                y={portal.baseline}
                textAnchor="middle"
                fill="#000"
                style={{ font: ampFont(portal.size) }}
              >
                &amp;
              </text>
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill={palette.bg}
            mask="url(#gg-intro-amp)"
          />
        </svg>
      )}

      {/* G [caficultores] G y, justo debajo, el dominio */}
      <div
        className={`flex flex-col items-center ${portal ? "invisible" : ""}`}
      >
        {/* En celular, una G debajo de la otra */}
        <div
          ref={logo}
          className={`flex flex-col items-center font-black uppercase leading-none tracking-[-0.03em] transition-[translate,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] text-[clamp(3rem,17vw,4.5rem)] sm:flex-row sm:text-[clamp(4.5rem,13vw,13rem)] ${
            phase === "start"
              ? "translate-y-3 opacity-0 motion-reduce:translate-y-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          {/* En celular la palabra completa (Grain / Grains); desde sm, G & G */}
          <span ref={(el) => void (gs.current[0] = el)}>
            <span className="sm:hidden">Grain</span>
            <span className="hidden sm:inline">G</span>
          </span>

          {/* El "&" se abre en un hueco por donde pasan los nombres */}
          <span
            className="relative flex items-center justify-center overflow-hidden transition-[width,height,margin] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              width: open ? "min(32rem, 86vw)" : "1.2em",
              height: open ? "1.15em" : "1.1em",
              marginInline: open ? "clamp(0rem, 2vw, 2rem)" : "0.02em",
            }}
          >
            <span
              ref={glyph}
              aria-hidden
              className={`${introAmp.className} absolute normal-case transition-[scale,opacity] duration-500 ${
                open ? "scale-50 opacity-0" : "scale-100 opacity-100"
              } ${closed ? "amp-in" : ""}`}
              style={{ color: palette.accent }}
            >
              &amp;
            </span>

            {/* Nombre del caficultor y su origen */}
            <span
              className={`absolute inset-0 flex flex-col items-center justify-center text-center normal-case tracking-normal transition-opacity duration-300 ${
                open ? "opacity-100" : "opacity-0"
              }`}
            >
              <span
                key={index}
                className={`${introHand.className} soft-fade block w-full truncate font-bold leading-none`}
                /* Nombres largos, un poco más chicos: siempre se leen completos */
                style={{
                  fontSize:
                    producer.name.length > 24
                      ? "clamp(1.55rem, 3vw, 2.7rem)"
                      : "clamp(1.9rem, 3.6vw, 3.3rem)",
                }}
              >
                {producer.name}
              </span>
              <span
                key={`o-${index}`}
                className={`${introMono.className} soft-fade mt-1.5 block text-[10px] font-medium uppercase tracking-[0.12em] opacity-85 sm:text-[11px]`}
              >
                {producer.origin}
              </span>
            </span>
          </span>

          <span ref={(el) => void (gs.current[1] = el)}>
            <span className="sm:hidden">Grains</span>
            <span className="hidden sm:inline">G</span>
          </span>
        </div>

        <p
          className={`${introMono.className} mt-4 text-[11px] font-medium tracking-[0.12em] transition-opacity duration-700 sm:mt-6 sm:text-xs ${
            phase === "start" || out ? "opacity-0 duration-200!" : "opacity-90"
          }`}
        >
          grainngrains.org
        </p>
      </div>

      {/* Barra de avance al pie de la pantalla */}
      <span
        aria-hidden
        className={`absolute bottom-0 left-0 h-1 origin-left ease-linear ${out ? "opacity-0" : ""}`}
        style={{
          width: "100%",
          backgroundColor: palette.accent,
          transform: `scaleX(${phase === "start" ? 0 : closed ? 1 : count / TOTAL})`,
        }}
      />

      {/* Contador de caficultores → frase final */}
      <p
        aria-live="polite"
        className={`${introMono.className} absolute bottom-8 left-1/2 w-[calc(100%-2rem)] -translate-x-1/2 text-center text-[11px] font-medium uppercase tracking-[0.12em] tabular-nums transition-opacity duration-200 sm:w-max sm:text-xs ${out ? "opacity-0" : ""}`}
      >
        {closed ? (
          <span className="soft-fade block">
            {t.rich("final", { count: rounded, trace: traceLink })}
          </span>
        ) : (
          <>
            <span className="font-bold" style={{ color: palette.accent }}>
              {fmt.format(count).padStart(5, "0")}
            </span>{" "}
            <span className="opacity-85">{t("counter")}</span>
          </>
        )}
      </p>

      <button
        type="button"
        onClick={finish}
        className={`${introMono.className} absolute right-5 top-5 cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] opacity-85 outline-none transition-[color,opacity] hover:text-(--intro-accent) hover:opacity-100 focus-visible:ring-2 focus-visible:ring-(--intro-accent) sm:right-8 sm:top-8 ${out ? "opacity-0!" : ""}`}
      >
        {t("skip")}
      </button>
    </div>
  );
}
