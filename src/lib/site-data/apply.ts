/* ───────────────────────────────────────────────────────────────
   Datos del panel aplicados sobre la web. El catálogo, los cupones, los
   envíos, el contacto, la promoción y los caficultores viven en módulos
   del código; aquí se les aplican los cambios hechos en el panel
   (Supabase). Así todos los componentes y la lógica de cobro siguen
   funcionando igual, pero con los datos del panel.
   - Se aplica en el servidor (ensureSiteData) y en el navegador
     (SiteDataProvider), siempre desde los valores originales del código:
     aplicarlo varias veces da el mismo resultado.
   - Las ediciones y cafés nuevos del panel se suman al catálogo del código.
   - Este archivo no usa nada del servidor: lo carga también el navegador.
─────────────────────────────────────────────────────────────── */
import {
  CATEGORIES,
  COMBOS,
} from "@/src/components/product-showcase/data";
import type {
  CertificationId,
  ShowcaseCategory,
  ShowcaseCombo,
  ShowcaseProduct,
} from "@/src/components/product-showcase/types";
import { COUPONS } from "@/src/lib/coupons/data";
import type { Coupon } from "@/src/lib/coupons";
import {
  setShopSettings,
  setCoffeeOptions,
  setSizes,
  type ProductOption,
  type ShopSettings,
  type SizeId,
  type SizeSetting,
} from "@/src/lib/shop";
import {
  setContact,
  setPromo,
  type ContactSettings,
  type PromoSettings,
} from "@/src/lib/site";

/** Un producto en el panel: cambios a uno del código o uno nuevo (custom) */
export interface ProductOverride {
  id: string;
  categoryId: string;
  /** Creado en el panel (no existe en el código) */
  custom?: boolean;
  active: boolean;
  deleted?: boolean;
  prices?: Partial<Record<SizeId, number>> | null;
  stock?: Partial<Record<SizeId, number | null>> | null;
  image?: string | null;
  hoverImage?: string | null;
  cardBg?: string | null;
  certifications?: CertificationId[] | null;
  sort?: number | null;
}

/** Varietales y procesos: las listas y qué tiene cada café (tablas propias) */
export interface CoffeeOptionsData {
  varietals: { id: string; active: boolean; sort: number | null }[];
  processes: { id: string; active: boolean; sort: number | null }[];
  links: {
    productId: string;
    kind: "varietals" | "processes";
    optionId: string;
    /** Visible para el cliente */
    active: boolean;
    sort: number | null;
  }[];
}

/** Una edición en el panel: cambios a una del código o una nueva (custom) */
export interface EditionOverride {
  id: string;
  custom?: boolean;
  active: boolean;
  deleted?: boolean;
  color?: string | null;
  panelBg?: string | null;
  panelImage?: string | null;
  heroTextColor?: string | null;
  headingColor?: string | null;
  sort?: number | null;
}

/** Un combo en el panel: cambios a uno del código o uno nuevo (custom) */
export interface ComboOverride {
  id: string;
  custom?: boolean;
  active: boolean;
  deleted?: boolean;
  discount?: number | null;
  items?: { categoryId: string; productId: string; size?: SizeId }[] | null;
  sort?: number | null;
}

export interface CouponOverride {
  code: string;
  data: Coupon;
  /** Oculta un cupón que existe en el código */
  deleted: boolean;
}

export interface SiteData {
  /** Cambia cuando cambia algo; evita volver a aplicar lo mismo */
  version: string;
  products: ProductOverride[];
  editions: EditionOverride[];
  combos: ComboOverride[];
  coupons: CouponOverride[];
  /** Presentaciones creadas en el panel (null = solo las del código) */
  sizes: SizeSetting[] | null;
  /** Varietales y procesos del panel (null = ninguno) */
  coffeeOptions: CoffeeOptionsData | null;
  /** null = se usan los del código */
  shop: ShopSettings | null;
  contact: ContactSettings | null;
  promo: PromoSettings | null;
}

export const EMPTY_SITE_DATA: SiteData = {
  version: "code",
  products: [],
  editions: [],
  combos: [],
  coupons: [],
  sizes: null,
  coffeeOptions: null,
  shop: null,
  contact: null,
  promo: null,
};

/* Copias de los valores originales del código (se toman al cargar) */
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const BASE_CATEGORIES: ShowcaseCategory[] = clone(CATEGORIES);
const BASE_COMBOS: ShowcaseCombo[] = clone(COMBOS);
const BASE_COUPONS: Coupon[] = clone(COUPONS);

/** Catálogo y cupones tal como están en el código (para el panel) */
export const baseCategories = () => BASE_CATEGORIES;
export const baseCombos = () => BASE_COMBOS;
export const baseCoupons = () => BASE_COUPONS;

/** Fondo de respaldo de la tarjeta cuando un café no tiene foto */
const FALLBACK_BG = "linear-gradient(135deg,#2e1a0a,#100804)";
/** Colores de una edición nueva si no se eligen otros */
export const NEW_EDITION_COLORS = {
  color: "#1E1E1E",
  panelBg: "#1E1E1E",
  heroTextColor: "#FFFFFF",
  headingColor: "#FFFFFF",
};

/** Solo los precios válidos (una presentación sin precio no se vende) */
const validPrices = (p: Partial<Record<SizeId, number>>) =>
  Object.fromEntries(
    Object.entries(p).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)]),
  ) as Record<SizeId, number>;

/** Un café del panel que no existe en el código (250 g es obligatoria) */
function customProduct(o: ProductOverride): ShowcaseProduct | null {
  const prices = validPrices(o.prices ?? {});
  if (!(prices["250g"] > 0)) return null;
  return {
    id: o.id,
    prices,
    certifications: o.certifications ?? [],
    bg: FALLBACK_BG,
    ...(o.cardBg && { cardBg: o.cardBg }),
    ...(o.image && { image: o.image }),
    ...(o.hoverImage && { hoverImage: o.hoverImage }),
    ...(o.stock && { stock: { ...o.stock } }),
  };
}

/**
 * Catálogo final: ediciones y cafés del código con los cambios del panel,
 * más las ediciones y cafés creados en el panel. Ordena por `sort` (los del
 * código conservan su orden si no se les puso uno) y quita lo oculto, lo
 * eliminado y las ediciones que se quedan sin cafés.
 * Con `all` devuelve también lo oculto (para el panel).
 */
export function buildCatalog(
  products: ProductOverride[],
  editions: EditionOverride[],
  { all = false } = {},
): ShowcaseCategory[] {
  const productById = new Map(products.map((p) => [p.id, p]));
  const editionById = new Map(editions.map((e) => [e.id, e]));
  const visible = (o?: { active: boolean; deleted?: boolean }) =>
    !o || (!o.deleted && (all || o.active));

  const base = BASE_CATEGORIES.map((c, i) => ({ c, o: editionById.get(c.id), sort: i * 10 }));
  const extra = editions
    .filter((e) => e.custom && !BASE_CATEGORIES.some((c) => c.id === e.id))
    .map((e, i) => ({
      c: {
        id: e.id,
        ...NEW_EDITION_COLORS,
        products: [],
      } as ShowcaseCategory,
      o: e,
      sort: (BASE_CATEGORIES.length + i) * 10,
    }));

  return [...base, ...extra]
    .filter(({ o }) => visible(o))
    .sort((a, b) => (a.o?.sort ?? a.sort) - (b.o?.sort ?? b.sort))
    .map(({ c, o }) => {
      /* Cafés del código que viven en esta edición (pueden venir de otra) */
      const fromCode = BASE_CATEGORIES.flatMap((bc) =>
        bc.products.flatMap((p, i) => {
          const o = productById.get(p.id);
          return (o?.categoryId ?? bc.id) === c.id ? [{ p, o, sort: (bc.id === c.id ? 0 : 1000) + i * 10 }] : [];
        }),
      );
      const fromPanel = products
        .filter((p) => p.custom && p.categoryId === c.id && !findInBase(p.id))
        .map((p, i) => ({ p: customProduct(p), o: p, sort: (c.products.length + i) * 10 }));
      const list = [...fromCode, ...fromPanel]
        .filter((x): x is { p: ShowcaseProduct; o: ProductOverride | undefined; sort: number } => Boolean(x.p) && visible(x.o))
        .sort((a, b) => (a.o?.sort ?? a.sort) - (b.o?.sort ?? b.sort))
        .map(({ p, o: po }) =>
          !po || po.custom
            ? { ...p, prices: { ...p.prices } }
            : {
                ...p,
                /* El panel guarda todas las presentaciones juntas: si hay
                   precios del panel, reemplazan a los del código */
                prices: po.prices?.["250g"] ? validPrices(po.prices) : { ...p.prices },
                ...(po.stock && { stock: { ...po.stock } }),
                ...(po.image && { image: po.image }),
                ...(po.hoverImage && { hoverImage: po.hoverImage }),
                ...(po.cardBg && { cardBg: po.cardBg }),
                ...(po.certifications && { certifications: po.certifications }),
              },
        );
      return {
        ...c,
        ...(o?.color && { color: o.color }),
        ...(o?.panelBg && { panelBg: o.panelBg }),
        ...(o?.panelImage && { panelImage: o.panelImage }),
        ...(o?.heroTextColor && { heroTextColor: o.heroTextColor }),
        ...(o?.headingColor && { headingColor: o.headingColor }),
        products: list,
      };
    })
    .filter((c) => all || c.products.length > 0);
}

/**
 * Combos finales: los del código con los cambios del panel, más los creados
 * en el panel, en su orden. Sin lo pausado ni lo eliminado (con `all`, el
 * panel recibe también lo pausado).
 */
export function buildCombos(
  overrides: ComboOverride[],
  { all = false } = {},
): ShowcaseCombo[] {
  const byId = new Map(overrides.map((o) => [o.id, o]));
  const base = BASE_COMBOS.map((c, i) => ({ c, o: byId.get(c.id), sort: i * 10 }));
  const extra = overrides
    .filter((o) => o.custom && !BASE_COMBOS.some((c) => c.id === o.id) && o.items?.length && o.discount !== null)
    .map((o, i) => ({
      c: { id: o.id, discount: Number(o.discount ?? 0), items: o.items ?? [] } as ShowcaseCombo,
      o,
      sort: (BASE_COMBOS.length + i) * 10,
    }));
  return [...base, ...extra]
    .filter(({ o }) => !o || (!o.deleted && (all || o.active)))
    .sort((a, b) => (a.o?.sort ?? a.sort) - (b.o?.sort ?? b.sort))
    .map(({ c, o }) => ({
      ...c,
      ...(o?.discount != null && Number.isFinite(Number(o.discount)) && { discount: Number(o.discount) }),
      ...(o?.items?.length && { items: o.items.map((i) => ({ ...i })) }),
    }));
}

/**
 * Varietales y procesos que ve el cliente en cada café: los que el café tiene
 * y están visibles, siempre que la varietal o el proceso esté activo en la
 * lista. Ordenados por el orden del café y luego por el de la lista.
 */
export function withOptions(
  categories: ShowcaseCategory[],
  o: CoffeeOptionsData | null | undefined,
): ShowcaseCategory[] {
  if (!o?.links.length) return categories;
  const pick = (productId: string, kind: "varietals" | "processes"): ProductOption[] => {
    const masters = o[kind];
    const order = (id: string) => {
      const m = masters.find((x) => x.id === id);
      return m?.sort ?? masters.indexOf(m!) * 10;
    };
    return o.links
      .filter((l) => l.productId === productId && l.kind === kind && l.active && masters.some((m) => m.id === l.optionId && m.active))
      .sort((a, b) => (a.sort ?? order(a.optionId)) - (b.sort ?? order(b.optionId)))
      .map((l) => ({ id: l.optionId }));
  };
  return categories.map((c) => ({
    ...c,
    products: c.products.map((p) => {
      const varietals = pick(p.id, "varietals");
      const processes = pick(p.id, "processes");
      return {
        ...p,
        ...(varietals.length && { varietals }),
        ...(processes.length && { processes }),
      };
    }),
  }));
}

const findInBase = (id: string) =>
  BASE_CATEGORIES.some((c) => c.products.some((p) => p.id === id));

let applied = "";

export function applySiteData(data: SiteData = EMPTY_SITE_DATA) {
  if (data.version === applied) return;
  applied = data.version;

  const categories = withOptions(buildCatalog(data.products, data.editions ?? []), data.coffeeOptions);
  CATEGORIES.splice(0, CATEGORIES.length, ...categories);

  /* Combos: solo si todos sus cafés siguen a la venta (estén en la
     edición que estén) */
  const visible = new Set(categories.flatMap((c) => c.products.map((p) => p.id)));
  COMBOS.splice(
    0,
    COMBOS.length,
    ...buildCombos(data.combos ?? []).filter((combo) =>
      combo.items.every(
        (i) =>
          visible.has(i.productId) &&
          Number(
            categories.flatMap((c) => c.products).find((p) => p.id === i.productId)?.prices[i.size ?? "250g"],
          ) > 0,
      ),
    ),
  );

  /* Cupones: los del panel pisan a los del código con el mismo código */
  const panel = new Map(data.coupons.map((c) => [c.code.toUpperCase(), c]));
  const merged: Coupon[] = BASE_COUPONS.flatMap((c) => {
    const o = panel.get(c.code.toUpperCase());
    if (!o) return [c];
    panel.delete(c.code.toUpperCase());
    return o.deleted ? [] : [o.data];
  });
  for (const o of panel.values()) if (!o.deleted) merged.push(o.data);
  COUPONS.splice(0, COUPONS.length, ...merged);

  setSizes(data.sizes ?? undefined);
  const o = data.coffeeOptions;
  setCoffeeOptions({
    varietals: (o?.varietals ?? []).filter((x) => x.active),
    processes: (o?.processes ?? []).filter((x) => x.active),
  });
  setShopSettings(data.shop ?? undefined);
  setContact(data.contact ?? undefined);
  setPromo(data.promo ?? undefined);
}
