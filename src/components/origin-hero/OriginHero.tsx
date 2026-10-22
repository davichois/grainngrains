import Image from "next/image";
import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import styles from "./OriginHero.module.css";

/* ───────────────────────────────────────────────────────────────
   Portada del inicio: "Descubre el VERDADERO ORIGEN del Café de
   Especialidad" (en el idioma de la página) con las latas pasando, igual
   que el video de antes pero en código (nítido y mucho más liviano).
   - Todo se mide en cqw (% del ancho del bloque) sobre la proporción del
     video (1280×694): se ve idéntico en computadora y celular.
   - Medidas, tiempos y colores sacados del video cuadro por cuadro.
─────────────────────────────────────────────────────────────── */

/** Duración de una vuelta completa (la del video) */
const LOOP_S = 22.52;
/** Ancho de cada lata (con su sombra), en % del ancho del bloque
 *  (si cambia, cambiar también originCan en OriginHero.module.css) */
const CAN_W = 30.3;

/** Latas en el orden del video y el segundo en que asoma cada una: una
 *  cada 22,52 / 8 s, parejas (en el video Guanábana y Vainilla venían más
 *  juntas y los colores se atropellaban) */
const CANS = [
  { id: "guardiansOfTheEarth", at: -0.11 },
  { id: "donEliseoFarm", at: 2.71 },
  { id: "daughtersOfTheForest", at: 5.52 },
  { id: "guanabana-infused", at: 8.34 },
  { id: "vanilla-infused", at: 11.15 },
  { id: "morningClassic", at: 13.96 },
  { id: "donEdwinFarm", at: 16.78 },
  { id: "donOsmarFarm", at: 19.59 },
];

/* Texto: tamaño y posición (borde superior de la caja) en cqw, medidos
   del video en español. Las palabras grandes van en Montserrat comprimida
   a lo ancho, como en el video */
const LAYOUT = [
  { key: "kicker", top: 5.98, size: 3.76, weight: 400, squeeze: 1 },
  { key: "big1", top: 9.64, size: 17.03, weight: 800, squeeze: 0.873 },
  { key: "big2", top: 26.67, size: 17.03, weight: 800, squeeze: 0.873 },
  { key: "sub", top: 43.87, size: 3.76, weight: 400, squeeze: 1 },
] as const;

/** Ancho máximo de una palabra grande (lo que ocupa "VERDADERO") */
const MAX_BIG_W = 102;
/** Ancho medio de una letra mayúscula de Montserrat 800, en em */
const LETTER_EM = 0.761;
/** Chino, japonés o coreano: otra proporción y sin comprimir */
const CJK = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;

/** Tamaño de cada línea en su idioma: las palabras más largas que
 *  "VERDADERO" se achican para no salirse más que en el video */
function fit(text: string, l: (typeof LAYOUT)[number]) {
  const cjk = CJK.test(text);
  const squeeze = cjk ? 1 : l.squeeze;
  let size = cjk ? l.size * 0.8 : l.size;
  if (l.size > 10) {
    const perChar = cjk ? 1 : LETTER_EM * squeeze;
    size = Math.min(size, MAX_BIG_W / (text.length * perChar));
  }
  /* Si se achica, se mantiene centrada en su renglón */
  const top = l.top + (l.size - size) * 0.5;
  return { size, squeeze, top };
}

export default async function OriginHero() {
  const t = await getTranslations("originHero");
  return (
    <div
      className={`${styles.stage} relative w-full select-none overflow-hidden`}
    >
      <p className={`${styles.text} absolute inset-0 m-0 text-center font-ui`}>
        {LAYOUT.map((l) => {
          const text = t(l.key);
          const { size, squeeze, top } = fit(text, l);
          return (
            <span
              key={l.key}
              className="absolute left-1/2 block w-max whitespace-nowrap leading-none"
              style={{
                top: `${top}cqw`,
                fontSize: `${size}cqw`,
                fontWeight: l.weight,
                /* Centrado aunque la palabra sea más ancha que el bloque */
                transform: `translateX(-50%) scaleX(${squeeze})`,
              }}
            >
              {text}
            </span>
          );
        })}
      </p>

      {CANS.map((c) => (
        <Image
          key={c.id}
          src={`/images/origin-cans/${c.id}.webp`}
          alt=""
          width={1100}
          height={1114}
          sizes="31vw"
          loading="eager"
          priority={c.at < 1}
          className={`${styles.can} absolute left-0 h-auto`}
          style={
            {
              top: "12.5cqw",
              width: `${CAN_W}cqw`,
              animationDelay: `${c.at}s`,
              animationDuration: `${LOOP_S}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
