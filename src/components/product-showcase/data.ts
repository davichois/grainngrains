import { ShowcaseCategory } from "./types";

/* ───────────────────────────────────────────────────────────────
   Los TEXTOS (name, subtitle, bigTop, bigBot, nombre de producto) están
   traducidos en /messages/<locale>.json bajo el namespace `editions`:
     editions.bigTop
     editions.<id>.{ name, bigBot, subtitle }
     editions.<id>.products.<productId>
   Aquí solo van datos no traducibles (id, colores, imágenes).

   IMÁGENES DE PRODUCTO (relativas a /public):
     public/images/products/<slug>.webp        → `image` (frontal)
     public/images/products/<slug>-hover.webp   → `hoverImage`
   Si se omiten, la tarjeta usa el gradiente `bg` de respaldo.

   IMAGEN DEL HERO (opcional):
     `panelImage` → public/images/hero/<slug>.svg ; si falta usa `panelBg`.
     Ajustes: `panelImageFit` ("cover"/"contain"), `panelImagePosition`,
              `panelImageQuality` (1-100).
   Colores: `heroTextColor` (letras del slider), `headingColor` (encabezado).
─────────────────────────────────────────────────────────────── */
const IMG = "/images/products";
const HERO = "/images/hero";

export const CATEGORIES: ShowcaseCategory[] = [
  {
    id: "farmers",
    color: "#000000",
    panelBg: "#F63049",
    panelImage: `${HERO}/edicion_caficultor.webp`,
    heroTextColor: "#fff0b4",
    headingColor: "#fff0b4",
    products: [
      {
        id: "donEliseoFarm",
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/031.webp`,
        hoverImage: `${IMG}/032.webp`,
      },
      {
        id: "donEdwinFarm",
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/010.webp`,
        hoverImage: `${IMG}/012.webp`,
      },
      {
        id: "donOsmarFarm",
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/021.webp`,
        hoverImage: `${IMG}/022.webp`,
      },
    ],
  },
  {
    id: "women",
    color: "#ff0064",
    panelBg: "#ff0064",
    panelImage: `${HERO}/edicion_mujeres.webp`,
    heroTextColor: "#fff6cd",
    headingColor: "#fff6cd",
    products: [
      {
        id: "daughtersOfTheForest",
        bg: "linear-gradient(135deg,#1a1a2e,#0a0a18)",
        image: `${IMG}/071.webp`,
        hoverImage: `${IMG}/072.webp`,
      },
      {
        id: "guardiansOfTheEarth",
        bg: "linear-gradient(135deg,#1a1a2e,#0a0a18)",
        image: `${IMG}/081.webp`,
        hoverImage: `${IMG}/082.webp`,
      },
    ],
  },
  {
    id: "classic",
    color: "#fcde81",
    panelBg: "#FFC95F",
    panelImage: `${HERO}/edicion_clasico.webp`,
    heroTextColor: "#00736B",
    headingColor: "#00736B",
    products: [
      {
        id: "morningClassic",
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/041.webp`,
        hoverImage: `${IMG}/042.webp`,
      },
    ],
  },
  {
    id: "infused",
    color: "#ffd44e",
    panelBg: "#FFB200",
    panelImage: `${HERO}/edicion_infusionados.webp`,
    heroTextColor: "#FFFFFF",
    headingColor: "#FFFFFF",
    products: [
      {
        id: "vanilla-infused",
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/051.webp`,
        hoverImage: `${IMG}/052.webp`,
      },
      {
        id: "guanabana-infused",
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/061.webp`,
        hoverImage: `${IMG}/062.webp`,
      },
    ],
  },
];
