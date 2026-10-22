"use client";

import { useEffect, useState } from "react";

/* Caracteres "encriptados" que pasan antes de fijarse la letra real */
const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*$@<>/\\=+";
const CJK = "アカサタナハマヤラワンキシチニヒミリ咖啡农源風土香気旅路個性";
const IS_CJK = /[぀-ヿ㐀-鿿가-힯]/;

const random = (pool: string) => pool[Math.floor(Math.random() * pool.length)];
const scrambleChar = (c: string) =>
  c === " " ? " " : random(IS_CJK.test(c) ? CJK : LATIN);

/**
 * Texto con efecto de "desencriptado": primero caracteres al azar que
 * cambian rápido, luego cada letra se fija de izquierda a derecha. Después,
 * cada tanto alguna letra vuelve a "parpadear" un instante.
 */
export default function ScrambleText({
  text,
  delay = 0,
  duration = 1400,
  glitchEvery = 2600,
  className,
}: {
  text: string;
  /** Espera antes de empezar (ms) */
  delay?: number;
  /** Cuánto tarda en fijarse toda la palabra (ms) */
  duration?: number;
  /** Cada cuánto parpadean algunas letras al azar (ms); 0 = nunca */
  glitchEvery?: number;
  className?: string;
}) {
  /* Primer pintado fijo (igual en servidor y navegador); el azar empieza
     después, ya en el navegador */
  const [shown, setShown] = useState(() =>
    [...text]
      .map((c, i) =>
        c === " " ? " " : (IS_CJK.test(c) ? CJK : LATIN)[(i * 7) % 20],
      )
      .join(""),
  );

  useEffect(() => {
    const letters = [...text];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = setTimeout(() => setShown(text), 0);
      return () => clearTimeout(id);
    }
    let raf = 0;
    let start = 0;
    let last = 0;
    const timers: number[] = [];

    /* Desencriptado inicial (se refresca cada ~45 ms, no en cada cuadro) */
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min((now - start) / duration, 1);
      if (now - last > 45 || p === 1) {
        last = now;
        const fixed = Math.floor(p * letters.length);
        setShown(
          letters.map((c, i) => (i < fixed ? c : scrambleChar(c))).join(""),
        );
      }
      if (p < 1) raf = requestAnimationFrame(tick);
      else if (glitchEvery > 0) glitch();
    };

    /* Parpadeo: 1 o 2 letras se encriptan unos instantes y vuelven */
    const glitch = () => {
      timers.push(
        window.setTimeout(
          () => {
            const idx = new Set(
              Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () =>
                Math.floor(Math.random() * letters.length),
              ),
            );
            let n = 0;
            const flick = () => {
              setShown(
                letters
                  .map((c, i) => (idx.has(i) && n < 4 ? scrambleChar(c) : c))
                  .join(""),
              );
              if (n++ < 4) timers.push(window.setTimeout(flick, 60));
              else glitch();
            };
            flick();
          },
          glitchEvery * (0.6 + Math.random() * 0.8),
        ),
      );
    };

    timers.push(
      window.setTimeout(() => (raf = requestAnimationFrame(tick)), delay),
    );
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [text, delay, duration, glitchEvery]);

  return (
    <span className={className} aria-label={text}>
      {/* Lo que se ve cambia; los lectores de pantalla leen la palabra real */}
      <span aria-hidden>{shown}</span>
    </span>
  );
}
