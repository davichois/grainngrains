/* ───────────────────────────────────────────────────────────────
   Configuración de la tienda: presentaciones, moliendas, envío y
   códigos de descuento. Los textos visibles están traducidos en
   /messages/<locale>.json bajo el namespace `shop`.
─────────────────────────────────────────────────────────────── */

/** Presentaciones del código; siempre existen (i18n: shop.sizes.<id>).
 *  250 g es obligatoria en todos los cafés (combos y precio "Desde") */
export const CODE_SIZES = ["250g", "1kg"] as const;
export type SizeId = string;
export const DEFAULT_SIZE: SizeId = "250g";

/** Presentaciones a la venta: las del código y las creadas en el panel
 *  (ver setSizes). Un café se vende solo en las que tienen precio */
export const SIZES: SizeId[] = [...CODE_SIZES];

/** Presentación creada en el panel (su nombre va en i18n: shop.sizes.<id>) */
export interface SizeSetting {
  id: string;
  sort?: number | null;
}

/** Aplica las presentaciones del panel (o vuelve a las del código) */
export function setSizes(extra: SizeSetting[] = []) {
  const code = CODE_SIZES as readonly string[];
  const added = [...extra]
    .filter((s) => !code.includes(s.id))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((s) => s.id);
  SIZES.splice(0, SIZES.length, ...code, ...added);
}

/* ───────── Varietales y procesos ─────────
   Se crean en el panel (Productos → Varietales y procesos). Sus nombres
   van en i18n: shop.varietals.<id> y shop.processes.<id>. Cada café dice
   cuáles ofrece; no cambian el precio. Desde el panel se pueden marcar
   como agotadas en un café. */

/** Opción de un café: una varietal o un proceso que el cliente puede elegir */
export interface ProductOption {
  id: string;
  /** Marcada como agotada en el panel (se ve, pero no se puede elegir) */
  soldOut?: boolean;
}

export const VARIETALS: string[] = [];
export const PROCESSES: string[] = [];

/** Aplica las listas del panel (ordenadas) */
export function setCoffeeOptions(o: { varietals?: SizeSetting[]; processes?: SizeSetting[] } = {}) {
  const ids = (l: SizeSetting[] = []) =>
    [...l].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)).map((x) => x.id);
  VARIETALS.splice(0, VARIETALS.length, ...ids(o.varietals));
  PROCESSES.splice(0, PROCESSES.length, ...ids(o.processes));
}

/** Presentaciones en las que se vende un café (las que tienen precio) */
export const sizesOf = (prices: Partial<Record<SizeId, number>>) =>
  SIZES.filter((s) => Number(prices[s]) > 0);

/** Tipos de molienda (i18n: shop.grinds.<id>) */
export const GRINDS = ["wholeBean", "coarse", "medium", "fine"] as const;
export type GrindId = (typeof GRINDS)[number];
export const DEFAULT_GRIND: GrindId = "wholeBean";

/** Moliendas antiguas (por método de preparación) → molienda actual,
    para los carritos guardados antes del cambio */
export const LEGACY_GRINDS: Record<string, GrindId> = {
  coarseDrip: "coarse",
  frenchPress: "coarse",
  toddy: "coarse",
  perkPress: "coarse",
  drip: "medium",
  coarseEspresso: "medium",
  xfDrip: "fine",
  espresso: "fine",
  xfEspresso: "fine",
};

/** Molienda válida a partir de un valor guardado (o la por defecto) */
export const normalizeGrind = (g: unknown): GrindId =>
  (GRINDS as readonly string[]).includes(g as string)
    ? (g as GrindId)
    : (LEGACY_GRINDS[g as string] ?? DEFAULT_GRIND);

/* ───────── Envío (solo delivery, en soles) ───────── */

/** Envío gratis desde este subtotal (después de descuentos). Se puede
 *  cambiar desde el panel (ver setShopSettings) */
export let FREE_SHIPPING_FROM = 150;

/** Departamentos que pagan la tarifa de Lima; el resto paga la de provincias */
export const LIMA_ZONE = ["Lima", "Callao"];

export const SHIPPING_RATES: { lima: number; provinces: number } = {
  lima: 10,
  provinces: 20,
};

/** Tiempo estimado de entrega, en días hábiles */
export const SHIPPING_DAYS: Record<
  "lima" | "provinces",
  { min: number; max: number }
> = {
  lima: { min: 1, max: 3 },
  provinces: { min: 3, max: 7 },
};

export type ShippingZone = keyof typeof SHIPPING_RATES;

export interface ShopSettings {
  freeShippingFrom: number;
  rates: { lima: number; provinces: number };
  days: Record<ShippingZone, { min: number; max: number }>;
}

/** Valores del código (los que se usan si el panel no cambió nada) */
export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  freeShippingFrom: FREE_SHIPPING_FROM,
  rates: { ...SHIPPING_RATES },
  days: {
    lima: { ...SHIPPING_DAYS.lima },
    provinces: { ...SHIPPING_DAYS.provinces },
  },
};

/** Aplica los ajustes de envío del panel (o vuelve a los del código) */
export function setShopSettings(s: ShopSettings = DEFAULT_SHOP_SETTINGS) {
  FREE_SHIPPING_FROM = s.freeShippingFrom;
  Object.assign(SHIPPING_RATES, s.rates);
  SHIPPING_DAYS.lima = { ...s.days.lima };
  SHIPPING_DAYS.provinces = { ...s.days.provinces };
}

export const shippingZone = (department: string): ShippingZone =>
  LIMA_ZONE.includes(department) ? "lima" : "provinces";

export const DEPARTMENTS = [
  "Amazonas",
  "Áncash",
  "Apurímac",
  "Arequipa",
  "Ayacucho",
  "Cajamarca",
  "Callao",
  "Cusco",
  "Huancavelica",
  "Huánuco",
  "Ica",
  "Junín",
  "La Libertad",
  "Lambayeque",
  "Lima",
  "Loreto",
  "Madre de Dios",
  "Moquegua",
  "Pasco",
  "Piura",
  "Puno",
  "San Martín",
  "Tacna",
  "Tumbes",
  "Ucayali",
] as const;

/** Costo de envío según departamento y subtotal; null si aún no hay departamento */
export function shippingCost(department: string, subtotal: number) {
  if (!department) return null;
  if (subtotal >= FREE_SHIPPING_FROM) return 0;
  return SHIPPING_RATES[shippingZone(department)];
}
