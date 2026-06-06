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
    panelImage: `${HERO}/edicion_caficultor.svg`,
    heroTextColor: "#fff0b4",
    headingColor: "#fff0b4",
    products: [
      {
        id: "donEliseoFarm",
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/031.png`,
        hoverImage: `${IMG}/032.png`,
      },
      {
        id: "donEdwinFarm",
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/010.png`,
        hoverImage: `${IMG}/012.png`,
      },
      {
        id: "donOsmarFarm",
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/021.png`,
        hoverImage: `${IMG}/022.png`,
      },
    ],
  },
  {
    id: "women",
    color: "#ff0064",
    panelBg: "#ff0064",
    panelImage: `${HERO}/edicion_mujeres.svg`,
    heroTextColor: "#fff6cd",
    headingColor: "#fff6cd",
    products: [
      {
        id: "daughtersOfTheForest",
        bg: "linear-gradient(135deg,#1a1a2e,#0a0a18)",
        image: `${IMG}/071.png`,
        hoverImage: `${IMG}/072.png`,
      },
      {
        id: "guardiansOfTheEarth",
        bg: "linear-gradient(135deg,#1a1a2e,#0a0a18)",
        image: `${IMG}/081.png`,
        hoverImage: `${IMG}/082.png`,
      },
    ],
  },
  {
    id: "classic",
    color: "#fcde81",
    panelBg: "#FFC95F",
    panelImage: `${HERO}/edicion_clasico.svg`,
    heroTextColor: "#00736B",
    headingColor: "#00736B",
    products: [
      {
        id: "morningClassic",
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/041.png`,
        hoverImage: `${IMG}/042.png`,
      },
    ],
  },
  {
    id: "infused",
    color: "#ffd44e",
    panelBg: "#FFB200",
    panelImage: `${HERO}/edicion_infusionados.svg`,
    heroTextColor: "#FFFFFF",
    headingColor: "#FFFFFF",
    products: [
      {
        id: "vanilla-infused",
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/051.png`,
        hoverImage: `${IMG}/052.png`,
      },
      {
        id: "guanabana-infused",
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/061.png`,
        hoverImage: `${IMG}/062.png`,
      },
    ],
  },
];
