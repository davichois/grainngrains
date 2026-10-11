/* ───────────────────────────────────────────────────────────────
   Configuración de la tienda: presentaciones, moliendas, envío y
   códigos de descuento. Los textos visibles están traducidos en
   /messages/<locale>.json bajo el namespace `shop`.
─────────────────────────────────────────────────────────────── */

/** Presentaciones a la venta (i18n: shop.sizes.<id>) */
export const SIZES = ["250g", "1kg"] as const;
export type SizeId = (typeof SIZES)[number];
export const DEFAULT_SIZE: SizeId = "250g";

/** Tipos de molienda, de más gruesa a más fina (i18n: shop.grinds.<id>) */
export const GRINDS = [
  "wholeBean",
  "coarseDrip",
  "drip",
  "xfDrip",
  "frenchPress",
  "toddy",
  "perkPress",
  "coarseEspresso",
  "espresso",
  "xfEspresso",
] as const;
export type GrindId = (typeof GRINDS)[number];
export const DEFAULT_GRIND: GrindId = "wholeBean";

/* ───────── Envío (solo delivery, en soles) ───────── */

/** Envío gratis desde este subtotal (después de descuentos) */
export const FREE_SHIPPING_FROM = 150;

/** Departamentos que pagan la tarifa de Lima; el resto paga la de provincias */
export const LIMA_ZONE = ["Lima", "Callao"];

export const SHIPPING_RATES = {
  lima: 10,
  provinces: 20,
} as const;

/** Tiempo estimado de entrega, en días hábiles */
export const SHIPPING_DAYS = {
  lima: { min: 1, max: 3 },
  provinces: { min: 3, max: 7 },
} as const;

export type ShippingZone = keyof typeof SHIPPING_RATES;

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

/* ───────── Códigos de descuento ───────── */

/** Código (en mayúsculas) → % de descuento sobre el subtotal */
export const DISCOUNT_CODES: Record<string, number> = {
  GRAIN10: 10,
};

export function discountFor(code: string) {
  return DISCOUNT_CODES[code.trim().toUpperCase()] ?? null;
}
