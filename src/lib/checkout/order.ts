/* ───────────────────────────────────────────────────────────────
   Pedido: validación y cálculo de montos. Se usa en el SERVIDOR para
   cobrar: los precios salen siempre de data.ts y src/lib/shop.ts, nunca
   de lo que envía el navegador.
─────────────────────────────────────────────────────────────── */
import {
  COMBO_CATEGORY,
  comboItemSize,
  comboDetails,
  findCombo,
  findProduct,
  productCategory,
  validOptions,
  inStock,
} from "@/src/components/product-showcase/data";
import {
  DEPARTMENTS,
  GRINDS,
  SIZES,
  shippingCost,
  type GrindId,
  type SizeId,
} from "@/src/lib/shop";
import {
  resolveCoupons,
  type CouponContext,
  type CouponResult,
  type CouponSuccess,
  type CouponUsage,
} from "@/src/lib/coupons";

/** Tope por pago con Yape en Mercado Pago, en soles */
export const YAPE_MAX = 2000;
/** Límite por defecto de la app Yape; el cliente puede subirlo hasta YAPE_MAX */
export const YAPE_DEFAULT_LIMIT = 500;

export interface OrderLineInput {
  categoryId: string;
  productId: string;
  size: SizeId;
  grind: GrindId;
  /** Varietal y proceso elegidos (si el café los ofrece) */
  varietal?: string;
  process?: string;
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
  /** Cupones y promociones aplicados (ya validados) */
  coupons: { code: string; discount: number; percent?: number }[];
  discountAmount: number;
  /** Productos de regalo de los cupones (van a S/ 0) */
  gifts: OrderLineInput[];
  shipping: number;
  total: number;
}

export interface OrderTotals {
  subtotal: number;
  /** Resultado del cupón escrito (null si no hay) */
  coupon: CouponResult | null;
  /** Todo lo aplicado: cupón escrito y promociones automáticas */
  applied: CouponSuccess[];
  discountAmount: number;
  /** Subtotal ya con descuento (base del envío gratis) */
  afterDiscount: number;
  /** null mientras no se elige departamento */
  shipping: number | null;
  total: number;
}

/**
 * Totales del pedido: subtotal, cupones, envío y total. Es la MISMA cuenta
 * en el checkout (para mostrarla) y en el servidor (para cobrar).
 */
export function computeTotals(
  lines: {
    categoryId: string;
    productId: string;
    size: SizeId;
    grind?: GrindId;
    qty: number;
    unitPrice: number;
  }[],
  opts: Omit<CouponContext, "lines" | "subtotal" | "shippingRate"> & {
    couponCode?: string;
  },
): OrderTotals {
  const subtotal = round2(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0));
  const { couponCode, ...ctx } = opts;
  /* Tarifa de la zona (sin el envío gratis por monto): base de los premios
     de envío y del valor de cada promoción */
  const shippingRate = shippingCost(ctx.department, 0) ?? 0;
  const { applied, manual } = resolveCoupons(couponCode, {
    ...ctx,
    lines,
    subtotal,
    shippingRate,
  });
  const discountAmount = round2(
    Math.min(
      applied.reduce((s, r) => s + r.discount, 0),
      subtotal,
    ),
  );
  const afterDiscount = round2(subtotal - discountAmount);
  const baseShipping = shippingCost(ctx.department, afterDiscount);
  const shipping =
    baseShipping === null
      ? null
      : applied.some((r) => r.freeShipping)
        ? 0
        : Math.max(
            0,
            round2(
              baseShipping -
                applied.reduce((s, r) => s + r.shippingDiscount, 0),
            ),
          );
  const total = round2(afterDiscount + (shipping ?? 0));
  return {
    subtotal,
    coupon: manual,
    applied,
    discountAmount,
    afterDiscount,
    shipping,
    total,
  };
}

export class OrderError extends Error {}

const round2 = (n: number) => Math.round(n * 100) / 100;

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
    const varietal = str(i.varietal, 60) || undefined;
    const process = str(i.process, 60) || undefined;
    const productId = str(i.productId);
    const categoryId = str(i.categoryId);
    return {
      /* Edición actual (el café se puede haber movido desde el panel) */
      categoryId: categoryId === COMBO_CATEGORY ? categoryId : (productCategory(productId) ?? categoryId),
      productId,
      size,
      grind,
      ...(varietal && { varietal }),
      ...(process && { process }),
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
  const product = findProduct(line.categoryId, line.productId);
  const base = product?.prices[line.size];
  if (base === undefined) return null;
  /* Varietal y proceso: deben ser de este café */
  if (!validOptions(product, line.varietal, line.process)) throw new OrderError("invalid_option");
  return base;
}

/** Calcula el pedido con los precios del catálogo (misma lógica que el checkout).
    `now` permite repetir la cuenta de un pago ya hecho (p. ej. en el webhook)
    con la vigencia de cupones de ese momento. */
export function priceOrder(
  input: CheckoutInput,
  opts: { now?: Date; usage?: CouponUsage | null } = {},
): PricedOrder {
  const lines = input.items.map((line) => {
    const unitPrice = catalogPrice(line);
    if (unitPrice === null) throw new OrderError("unknown_product");
    return { ...line, unitPrice, lineTotal: round2(unitPrice * line.qty) };
  });
  const totals = computeTotals(lines, {
    department: input.address.department,
    receiptType: input.receipt.type,
    payment: input.payment,
    locale: input.locale,
    customer: {
      email: input.customer.email,
      document:
        input.receipt.type === "factura"
          ? input.receipt.ruc
          : input.receipt.document,
      newsletter: input.customer.newsletter,
    },
    couponCode: input.discountCode,
    now: opts.now,
    usage: opts.usage,
  });
  /* El checkout solo envía cupones válidos: si no aplica, algo cambió
     (límite de usos, vigencia…). Se informa el motivo concreto. */
  const c = totals.coupon;
  if (c && !c.ok) {
    const specific = [
      "used_up",
      "used_up_today",
      "loyalty",
      "already_used",
      "first_purchase",
      "unavailable",
      "expired",
    ];
    throw new OrderError(
      specific.includes(c.reason) ? `coupon_${c.reason}` : "coupon_invalid",
    );
  }
  if (totals.total <= 0) throw new OrderError("invalid_total");
  return {
    lines,
    subtotal: totals.subtotal,
    coupons: totals.applied.map((r) => ({
      code: r.coupon.code,
      discount: r.discount,
      percent: r.percent,
    })),
    discountAmount: totals.discountAmount,
    gifts: totals.applied.flatMap((r) =>
      r.gift
        ? [
            {
              categoryId: r.gift.categoryId,
              productId: r.gift.productId,
              size: r.gift.size,
              grind: r.gift.grind,
              qty: r.gift.qty ?? 1,
            },
          ]
        : [],
    ),
    shipping: totals.shipping ?? 0,
    total: totals.total,
  };
}

/** Revisa que haya stock de todo lo que se va a cobrar (regalos incluidos) */
export function checkStock(priced: PricedOrder) {
  const units = new Map<string, number>();
  const add = (
    categoryId: string,
    productId: string,
    size: SizeId,
    qty: number,
  ) => {
    const k = `${categoryId}|${productId}|${size}`;
    units.set(k, (units.get(k) ?? 0) + qty);
  };
  for (const l of [...priced.lines, ...priced.gifts]) {
    if (l.categoryId === COMBO_CATEGORY) {
      findCombo(l.productId)?.items.forEach((i) =>
        add(i.categoryId, i.productId, comboItemSize(i), l.qty),
      );
    } else add(l.categoryId, l.productId, l.size, l.qty);
  }
  for (const [k, qty] of units) {
    const [categoryId, productId, size] = k.split("|");
    if (!inStock(findProduct(categoryId, productId), size as SizeId, qty)) {
      throw new OrderError("out_of_stock");
    }
  }
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
