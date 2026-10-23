import {
  Certification,
  CertificationId,
  ShowcaseCategory,
  ShowcaseCombo,
  ShowcaseProduct,
} from "./types";
import { PROCESSES, VARIETALS, type ProductOption, type SizeId } from "@/src/lib/shop";

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
        prices: { "250g": 60, "1kg": 240 },
        certifications: ["fairtrade", "usdaOrganic", "cleanCup"],
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/031.webp`,
        hoverImage: `${IMG}/032.webp`,
      },
      {
        id: "donEdwinFarm",
        prices: { "250g": 60, "1kg": 240 },
        certifications: ["fairtrade", "usdaOrganic", "cleanCup"],
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/010.webp`,
        hoverImage: `${IMG}/012.webp`,
      },
      {
        id: "donOsmarFarm",
        prices: { "250g": 60, "1kg": 240 },
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
        prices: { "250g": 60, "1kg": 240 },
        certifications: ["fairtrade", "usdaOrganic", "cleanCup"],
        bg: "linear-gradient(135deg,#1a1a2e,#0a0a18)",
        image: `${IMG}/071.webp`,
        hoverImage: `${IMG}/072.webp`,
      },
      {
        id: "guardiansOfTheEarth",
        prices: { "250g": 60, "1kg": 240 },
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
        prices: { "250g": 60, "1kg": 240 },
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
        prices: { "250g": 60, "1kg": 240 },
        certifications: [],
        bg: "linear-gradient(135deg,#2e1a0a,#100804)",
        image: `${IMG}/051.webp`,
        hoverImage: `${IMG}/052.webp`,
      },
      {
        id: "guanabana-infused",
        prices: { "250g": 60, "1kg": 240 },
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
  return (
    CATEGORIES.find((c) => c.id === categoryId)?.products.find((p) => p.id === productId) ??
    /* El café se movió a otra edición (carritos, combos o cupones guardados
       con la edición anterior siguen funcionando) */
    CATEGORIES.flatMap((c) => c.products).find((p) => p.id === productId)
  );
}

/** Edición en la que está hoy un café (se pueden mover desde el panel) */
export function productCategory(productId: string) {
  return CATEGORIES.find((c) => c.products.some((p) => p.id === productId))?.id;
}

/** Varietales y procesos que ofrece un café (solo los que siguen en las
 *  listas del panel) */
export function productOptions(product: Pick<ShowcaseProduct, "varietals" | "processes"> | undefined) {
  const keep = (list: ProductOption[] | undefined, valid: string[]) =>
    (list ?? []).filter((o) => valid.includes(o.id));
  return {
    varietals: keep(product?.varietals, VARIETALS),
    processes: keep(product?.processes, PROCESSES),
  };
}

/** ¿La varietal y el proceso elegidos son de este café? (si el café ofrece
 *  varietales o procesos, hay que elegir uno de cada uno) */
export function validOptions(
  product: Pick<ShowcaseProduct, "varietals" | "processes"> | undefined,
  varietal?: string,
  process?: string,
) {
  const { varietals, processes } = productOptions(product);
  const ok = (list: ProductOption[], id?: string) =>
    list.length ? list.some((o) => o.id === id) : !id;
  return ok(varietals, varietal) && ok(processes, process);
}

/** " · Geisha · Lavado" para mostrar en el carrito, el checkout y el correo */
export function optionsLabel(
  item: { varietal?: string; process?: string },
  name: (kind: "varietals" | "processes", id: string) => string,
) {
  const parts = [
    item.varietal && name("varietals", item.varietal),
    item.process && name("processes", item.process),
  ].filter(Boolean);
  return parts.length ? ` · ${parts.join(" · ")}` : "";
}

/** Unidades disponibles de una presentación; Infinity si no hay límite */
export function stockOf(
  product: Pick<ShowcaseProduct, "stock"> | undefined,
  size: SizeId,
) {
  const n = product?.stock?.[size];
  return typeof n === "number" ? Math.max(0, n) : Infinity;
}

/** ¿Se puede comprar `qty` de esta presentación? */
export const inStock = (
  product: Pick<ShowcaseProduct, "stock"> | undefined,
  size: SizeId,
  qty = 1,
) => stockOf(product, size) >= qty;

/** Un combo se puede comprar si todos sus cafés están (en su presentación) */
export const comboInStock = (combo: ShowcaseCombo, qty = 1) =>
  combo.items.every((i) =>
    inStock(findProduct(i.categoryId, i.productId), comboItemSize(i), qty),
  );

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

/** Presentación de un café dentro de un combo si no se eligió otra */
export const COMBO_SIZE: SizeId = "250g";

/** Presentación de un café del combo */
export const comboItemSize = (i: { size?: SizeId }) => i.size ?? COMBO_SIZE;

/** "250 g c/u" si todos van en la misma presentación; si no, "1 kg + 250 g" */
export function comboSizeText(
  combo: ShowcaseCombo,
  sizeName: (s: SizeId) => string,
  each: string,
) {
  const sizes = combo.items.map(comboItemSize);
  return new Set(sizes).size === 1
    ? `${sizeName(sizes[0])} ${each}`
    : sizes.map(sizeName).join(" + ");
}

export function findCombo(comboId: string) {
  return COMBOS.find((c) => c.id === comboId);
}

/** Cafés del combo (con su color de tarjeta), precio normal y precio con descuento */
export function comboDetails(combo: ShowcaseCombo) {
  const products = combo.items.flatMap((i) => {
    const category = CATEGORIES.find((c) => c.id === (productCategory(i.productId) ?? i.categoryId));
    const product = category?.products.find((p) => p.id === i.productId);
    return category && product
      ? [
          {
            categoryId: category.id,
            product,
            size: comboItemSize(i),
            bg: product.cardBg ?? category.color,
          },
        ]
      : [];
  });
  const regular = products.reduce(
    (sum, p) => sum + (p.product.prices[p.size] ?? 0),
    0,
  );
  const price = Math.round(regular * (100 - combo.discount)) / 100;
  return { products, regular, price };
}
