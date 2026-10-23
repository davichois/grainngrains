import localFont from "next/font/local";
import { Jost, Montserrat } from "next/font/google";

/* Tipografías de la marca, compartidas por la web y el panel */

export const futura = localFont({
  src: [
    {
      path: "../../public/fonts/FuturaCyrillicLight.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/FuturaCyrillicBook.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/FuturaCyrillicMedium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/FuturaCyrillicDemi.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/FuturaCyrillicBold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/FuturaCyrillicHeavy.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/FuturaCyrillicExtraBold.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-futura",
  display: "swap",
  /* Sin respaldo Arial: las letras que faltan las pone Jost (abajo) */
  adjustFontFallback: false,
});

/* Los archivos de Futura no traen tildes, Ñ ni ¿¡. Jost (inspirada en
   Futura, con todos los acentos) dibuja solo esas letras faltantes */
export const jost = Jost({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-jost",
});

/* Tipografía de interfaz (opciones, formularios, precios) en la tienda */
export const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});
