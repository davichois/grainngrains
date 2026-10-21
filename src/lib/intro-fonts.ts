import { Caveat, Fraunces, JetBrains_Mono } from "next/font/google";

/* Tipografías de la intro: letra manuscrita para los nombres de los
   caficultores (como su firma; es la misma Caveat del pie de la web), una
   serif cursiva bien gruesa para el "&" y una monoespaciada para el origen y el
   contador (como un registro de trazabilidad). La marca sigue en Futura. */
export const introHand = Caveat({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "700"],
  display: "swap",
});

export const introAmp = Fraunces({
  subsets: ["latin"],
  weight: "900",
  style: "italic",
  display: "swap",
});

export const introMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});
