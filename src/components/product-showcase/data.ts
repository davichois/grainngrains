import {
  Certification,
  CertificationId,
  ShowcaseCategory,
  ShowcaseCombo,
} from "./types";
import type { SizeId } from "@/src/lib/shop";

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

   PRECIOS: `prices` de cada producto, en soles (S/), uno por presentación
   ("250g" y "1kg", definidas en src/lib/shop.ts). La tarjeta muestra el de
   250 g ("Desde") y el carrito usa el de la presentación elegida.

   CERTIFICACIONES: `certifications` de cada producto, con ids de
   CERTIFICATIONS (logos en public/certificates/). Se muestran como sellos
   en la parte superior de la tarjeta, en el orden de la lista.

   COMBOS: al final del archivo (COMBOS). Cada combo lista sus cafés y un
   `discount` en %; su precio se calcula solo a partir de los precios de
   250 g de esos cafés (los combos se venden en 250 g). Nombres traducidos en messages bajo cart.combos.<id>.name
─────────────────────────────────────────────────────────────── */
const IMG = "/images/products";
const HERO = "/images/hero";
const CERT = "/certificates";

export const CERTIFICATIONS: Record<CertificationId, Certification> = {
  fairtrade: {
    name: "Fairtrade International",
    logo: `${CERT}/fairtrade-international.svg`,
  },
  usdaOrganic: { name: "USDA Organic", logo: `${CERT}/USDA_organic.webp` },
  cleanCup: {
    name: "Clean Cup Alliance",
    logo: `${CERT}/cleancupalliance.webp`,
  },
};

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
        prices: { "250g": 25, "1kg": 85 },
        certifications: ["fairtrade", "usdaOrganic", "cleanCup"],
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/031.webp`,
        hoverImage: `${IMG}/032.webp`,
      },
      {
        id: "donEdwinFarm",
        prices: { "250g": 45, "1kg": 150 },
        certifications: ["fairtrade", "usdaOrganic", "cleanCup"],
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/010.webp`,
        hoverImage: `${IMG}/012.webp`,
      },
      {
        id: "donOsmarFarm",
        prices: { "250g": 45, "1kg": 150 },
        certifications: ["fairtrade", "usdaOrganic", "cleanCup"],
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
        prices: { "250g": 45, "1kg": 150 },
        certifications: ["fairtrade", "usdaOrganic", "cleanCup"],
        bg: "linear-gradient(135deg,#1a1a2e,#0a0a18)",
        image: `${IMG}/071.webp`,
        hoverImage: `${IMG}/072.webp`,
      },
      {
        id: "guardiansOfTheEarth",
        prices: { "250g": 45, "1kg": 150 },
        certifications: ["fairtrade", "usdaOrganic", "cleanCup"],
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
        prices: { "250g": 45, "1kg": 150 },
        certifications: ["fairtrade", "usdaOrganic", "cleanCup"],
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
        prices: { "250g": 45, "1kg": 150 },
        certifications: [],
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/051.webp`,
        hoverImage: `${IMG}/052.webp`,
      },
      {
        id: "guanabana-infused",
        prices: { "250g": 45, "1kg": 150 },
        certifications: [],
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/061.webp`,
        hoverImage: `${IMG}/062.webp`,
      },
    ],
  },
];

/** Busca un producto del catálogo por edición e id */
export function findProduct(categoryId: string, productId: string) {
  return CATEGORIES.find((c) => c.id === categoryId)?.products.find(
    (p) => p.id === productId,
  );
}

/* ───────── Combos (se recomiendan en el carrito) ───────── */
export const COMBOS: ShowcaseCombo[] = [
  {
    id: "farmersTrio",
    discount: 3,
    items: [
      { categoryId: "farmers", productId: "donEliseoFarm" },
      { categoryId: "farmers", productId: "donEdwinFarm" },
      { categoryId: "farmers", productId: "donOsmarFarm" },
    ],
  },
  {
    id: "discovery",
    discount: 15,
    items: [
      { categoryId: "farmers", productId: "donEdwinFarm" },
      { categoryId: "women", productId: "daughtersOfTheForest" },
      { categoryId: "classic", productId: "morningClassic" },
      { categoryId: "infused", productId: "vanilla-infused" },
    ],
  },
  {
    id: "womenDuo",
    discount: 10,
    items: [
      { categoryId: "women", productId: "daughtersOfTheForest" },
      { categoryId: "women", productId: "guardiansOfTheEarth" },
    ],
  },
  {
    id: "infusedDuo",
    discount: 10,
    items: [
      { categoryId: "infused", productId: "vanilla-infused" },
      { categoryId: "infused", productId: "guanabana-infused" },
    ],
  },
];

/** "Edición" con la que se guardan los combos en el carrito */
export const COMBO_CATEGORY = "combo";

/** Presentación de cada café dentro de un combo */
export const COMBO_SIZE: SizeId = "250g";

export function findCombo(comboId: string) {
  return COMBOS.find((c) => c.id === comboId);
}

/** Cafés del combo (con su color de tarjeta), precio normal y precio con descuento */
export function comboDetails(combo: ShowcaseCombo) {
  const products = combo.items.flatMap(({ categoryId, productId }) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    const product = category?.products.find((p) => p.id === productId);
    return category && product
      ? [{ categoryId, product, bg: product.cardBg ?? category.color }]
      : [];
  });
  const regular = products.reduce(
    (sum, p) => sum + p.product.prices[COMBO_SIZE],
    0,
  );
  const price = Math.round(regular * (100 - combo.discount)) / 100;
  return { products, regular, price };
}
