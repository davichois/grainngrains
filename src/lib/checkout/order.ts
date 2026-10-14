/* ───────────────────────────────────────────────────────────────
   Pedido: validación y cálculo de montos. Se usa en el SERVIDOR para
   cobrar: los precios salen siempre de data.ts y src/lib/shop.ts, nunca
   de lo que envía el navegador.
─────────────────────────────────────────────────────────────── */
import {
  COMBO_CATEGORY,
  comboDetails,
  findCombo,
  findProduct,
} from "@/src/components/product-showcase/data";
import {
  DEPARTMENTS,
  GRINDS,
  SIZES,
  discountFor,
  shippingCost,
  type GrindId,
  type SizeId,
} from "@/src/lib/shop";

/** Tope por pago con Yape en Mercado Pago, en soles */
export const YAPE_MAX = 2000;
/** Límite por defecto de la app Yape; el cliente puede subirlo hasta YAPE_MAX */
export const YAPE_DEFAULT_LIMIT = 500;

export interface OrderLineInput {
  categoryId: string;
  productId: string;
  size: SizeId;
  grind: GrindId;
  qty: number;
}

export interface CheckoutInput {
  locale: string;
  items: OrderLineInput[];
  discountCode?: string;
  payment: "wallet" | "card";
  customer: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    newsletter: boolean;
  };
  address: {
    department: string;
    province: string;
    district: string;
    address: string;
    reference?: string;
  };
  receipt:
    | { type: "boleta"; document: string }
    | { type: "factura"; ruc: string; businessName: string };
}

export interface PricedLine extends OrderLineInput {
  unitPrice: number;
  lineTotal: number;
}

export interface PricedOrder {
  lines: PricedLine[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  shipping: number;
  total: number;
}

export class OrderError extends Error {}

const str = (v: unknown, max = 200) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** Valida el JSON recibido y lo normaliza; lanza OrderError si algo no cuadra */
export function parseCheckoutInput(body: unknown): CheckoutInput {
  if (!body || typeof body !== "object") throw new OrderError("invalid_body");
  const b = body as Record<string, unknown>;
  const c = (b.customer ?? {}) as Record<string, unknown>;
  const a = (b.address ?? {}) as Record<string, unknown>;
  const r = (b.receipt ?? {}) as Record<string, unknown>;

  const items = Array.isArray(b.items) ? b.items : [];
  if (items.length === 0 || items.length > 50)
    throw new OrderError("empty_cart");

  const parsedItems: OrderLineInput[] = items.map((raw) => {
    const i = (raw ?? {}) as Record<string, unknown>;
    const qty = Number(i.qty);
    const size = str(i.size) as SizeId;
    const grind = str(i.grind) as GrindId;
    if (!Number.isInteger(qty) || qty < 1 || qty > 99)
      throw new OrderError("invalid_qty");
    if (!SIZES.includes(size) || !GRINDS.includes(grind))
      throw new OrderError("invalid_option");
    return {
      categoryId: str(i.categoryId),
      productId: str(i.productId),
      size,
      grind,
      qty,
    };
  });

  const email = str(c.email, 120);
  const phone = str(c.phone, 9);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new OrderError("invalid_email");
  if (!/^9\d{8}$/.test(phone)) throw new OrderError("invalid_phone");

  const department = str(a.department, 40);
  if (!(DEPARTMENTS as readonly string[]).includes(department)) {
    throw new OrderError("invalid_department");
  }

  let receipt: CheckoutInput["receipt"];
  if (r.type === "factura") {
    const ruc = str(r.ruc, 11);
    if (!/^(10|15|17|20)\d{9}$/.test(ruc)) throw new OrderError("invalid_ruc");
    receipt = { type: "factura", ruc, businessName: str(r.businessName, 150) };
  } else {
    const document = str(r.document, 12);
    if (!/^\d{8,12}$/.test(document)) throw new OrderError("invalid_document");
    receipt = { type: "boleta", document };
  }

  const required = [c.firstName, c.lastName, a.province, a.district, a.address];
  if (required.some((v) => !str(v))) throw new OrderError("missing_fields");

  return {
    locale: str(b.locale, 5) || "es",
    items: parsedItems,
    discountCode: str(b.discountCode, 40) || undefined,
    payment: b.payment === "card" ? "card" : "wallet",
    customer: {
      email,
      phone,
      firstName: str(c.firstName, 60),
      lastName: str(c.lastName, 60),
      newsletter: c.newsletter === true,
    },
    address: {
      department,
      province: str(a.province, 60),
      district: str(a.district, 60),
      address: str(a.address, 200),
      reference: str(a.reference, 200) || undefined,
    },
    receipt,
  };
}

/** Precio unitario según el catálogo (combos: suma con descuento) */
function catalogPrice(line: OrderLineInput) {
  if (line.categoryId === COMBO_CATEGORY) {
    const combo = findCombo(line.productId);
    return combo ? comboDetails(combo).price : null;
  }
  return (
    findProduct(line.categoryId, line.productId)?.prices[line.size] ?? null
  );
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Calcula el pedido con los precios del catálogo (misma lógica que el checkout) */
export function priceOrder(input: CheckoutInput): PricedOrder {
  const lines = input.items.map((line) => {
    const unitPrice = catalogPrice(line);
    if (unitPrice === null) throw new OrderError("unknown_product");
    return { ...line, unitPrice, lineTotal: round2(unitPrice * line.qty) };
  });
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const discountPercent = input.discountCode
    ? (discountFor(input.discountCode) ?? 0)
    : 0;
  const discountAmount = round2((subtotal * discountPercent) / 100);
  const afterDiscount = round2(subtotal - discountAmount);
  const shipping = shippingCost(input.address.department, afterDiscount) ?? 0;
  const total = round2(afterDiscount + shipping);
  if (total <= 0) throw new OrderError("invalid_total");
  return {
    lines,
    subtotal,
    discountPercent,
    discountAmount,
    shipping,
    total,
  };
}

/** Número de pedido legible, p. ej. GG-20261011-4F7Q */
export function newOrderNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GG-${ymd}-${rand}`;
}

/** Documento del comprador para Mercado Pago según el comprobante */
export function payerIdentification(receipt: CheckoutInput["receipt"]) {
  if (receipt.type === "factura") return { type: "RUC", number: receipt.ruc };
  const doc = receipt.document;
  return { type: doc.length === 8 ? "DNI" : "C.E", number: doc };
}
