/* ───────────────────────────────────────────────────────────────
   Motor de cupones: valida las reglas y calcula el premio. Lo usan el
   checkout (para mostrar el descuento) y el servidor (para cobrar), así
   ambos llegan siempre al mismo monto. Los cupones están en ./data.ts y
   se escriben con las palabras clave de ./keywords.ts.
─────────────────────────────────────────────────────────────── */
import {
  COMBO_CATEGORY,
  findCombo,
  findProduct,
  productCategory,
} from "@/src/components/product-showcase/data";
import {
  shippingZone,
  type GrindId,
  type ShippingZone,
  type SizeId,
} from "@/src/lib/shop";
import { COUPONS } from "./data";

export type PaymentKind = "wallet" | "card";

export type GiftReward = {
  type: "gift";
  categoryId: string;
  productId: string;
  size: SizeId;
  grind: GrindId;
  qty?: number;
};

export type CouponReward =
  | { type: "percent"; value: number; maxDiscount?: number }
  | { type: "fixed"; value: number }
  /** S/ value por cada S/ every de compra (p. ej. S/ 10 por cada S/ 100) */
  | { type: "fixedPer"; value: number; every: number }
  | { type: "percentItem"; value: number; target: "cheapest" | "mostExpensive" }
  | { type: "fixedPrice"; price: number }
  | { type: "buyXgetY"; buy: number; get: number; discount?: number }
  | GiftReward
  | { type: "freeShipping" }
  | { type: "shippingDiscount"; value: number }
  | { type: "shippingPercent"; value: number }
  /** El envío cuesta como máximo `price` */
  | { type: "shippingFixed"; price: number }
  | {
      type: "tiered";
      by?: "qty" | "amount";
      tiers: { min: number; percent: number }[];
    };

/** Lista de clientes por correo, dominio o documento (DNI/RUC) */
export interface CustomerList {
  emails?: string[];
  domains?: string[];
  documents?: string[];
}

export interface CouponRules {
  /* Carrito */
  minSubtotal?: number;
  maxSubtotal?: number;
  minQty?: number;
  maxQty?: number;
  /** Mínimo de productos distintos */
  minDistinct?: number;
  requireProducts?: string[];
  /** Cantidad mínima de ciertos productos: { donEliseoFarm: 2 } */
  requireQty?: Record<string, number>;
  /* Qué recibe el descuento */
  editions?: string[];
  excludeEditions?: string[];
  products?: string[];
  excludeProducts?: string[];
  sizes?: SizeId[];
  grinds?: GrindId[];
  excludeCombos?: boolean;
  onlyCombos?: boolean;
  /** El descuento alcanza como máximo a N bolsas (las más caras) */
  maxDiscountedUnits?: number;
  /** Tope del descuento en soles, para cualquier premio */
  maxDiscount?: number;
  /* Cliente */
  wholesale?: boolean;
  /** Solo con Boleta (consumidor final) */
  consumerOnly?: boolean;
  customers?: CustomerList;
  excludeCustomers?: CustomerList;
  newsletter?: boolean;
  locales?: string[];
  /* Pago y envío */
  paymentMethods?: PaymentKind[];
  zones?: ShippingZone[];
  departments?: string[];
  excludeDepartments?: string[];
  /* Fechas (hora de Lima). validFrom/Until aceptan "AAAA-MM-DD" o "AAAA-MM-DD HH:MM" */
  validFrom?: string;
  validUntil?: string;
  dates?: string[];
  monthDays?: number[];
  daysOfWeek?: number[];
  /** Puede cruzar la medianoche: { from: "22:00", to: "02:00" } */
  hours?: { from: string; to: string };
  /* Límites de uso (registro en Upstash Redis) */
  firstPurchase?: boolean;
  /** Pedidos pagados previos mínimos (clientes frecuentes) */
  minPreviousOrders?: number;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  maxUsesPerDay?: number;
  /** Soles de descuento totales que se pueden regalar con el cupón */
  budget?: number;
}

export interface Coupon {
  code: string;
  /** Otros códigos que aplican el mismo cupón (influencers, campañas) */
  aliases?: string[];
  reward: CouponReward;
  rules?: CouponRules;
  active?: boolean;
  /** Se aplica solo, sin escribir el código */
  autoApply?: boolean;
  /** Se suma con otras promociones apilables */
  stackable?: boolean;
  /** No se combina con nada: o este cupón, o las demás promociones */
  exclusive?: boolean;
  /** Nota interna; no se muestra */
  note?: string;
}

/** Línea del carrito con su precio de catálogo */
export interface CouponLine {
  categoryId: string;
  productId: string;
  size: SizeId;
  grind?: GrindId;
  qty: number;
  unitPrice: number;
}

/** Usos registrados (solo en el servidor) */
export interface CouponUsage {
  /** Usos totales por código */
  uses: Record<string, number>;
  /** Usos de este cliente por código */
  customerUses: Record<string, number>;
  /** Usos de hoy (hora de Lima) por código */
  dayUses?: Record<string, number>;
  /** Soles de descuento ya regalados por código */
  spent?: Record<string, number>;
  /** Pedidos pagados previos de este cliente */
  customerOrders: number;
}

export interface CouponContext {
  lines: CouponLine[];
  subtotal: number;
  /** Departamento de envío ("" si aún no se elige) */
  department: string;
  /** Tarifa de envío de la zona (antes del envío gratis por monto) */
  shippingRate?: number;
  receiptType: "boleta" | "factura";
  payment?: PaymentKind;
  customer?: { email?: string; document?: string; newsletter?: boolean };
  locale?: string;
  /**
   * undefined: no se revisan los límites de uso (checkout / pago ya hecho).
   * null: no hay registro configurado → los cupones con límite no aplican.
   */
  usage?: CouponUsage | null;
  now?: Date;
}

/** Por qué un cupón no aplica (con datos para el mensaje) */
export type CouponFailure =
  | {
      reason:
        | "not_found"
        | "expired"
        | "not_started"
        | "schedule"
        | "wholesale"
        | "consumer_only"
        | "customer_only"
        | "newsletter"
        | "first_purchase"
        | "used_up"
        | "used_up_today"
        | "already_used"
        | "unavailable"
        | "better_promo";
    }
  | { reason: "min_subtotal"; amount: number }
  | { reason: "max_subtotal"; amount: number }
  | { reason: "min_qty"; count: number }
  | { reason: "max_qty"; count: number }
  | { reason: "min_distinct"; count: number }
  | { reason: "loyalty"; count: number }
  | { reason: "no_eligible"; editions?: string[]; sizes?: SizeId[] }
  | { reason: "required_products"; products: string[] }
  | { reason: "zone"; zones: ShippingZone[] }
  | { reason: "department"; departments: string[] }
  | { reason: "excluded_department"; departments: string[] }
  | { reason: "payment_method"; methods: PaymentKind[] };

export interface CouponSuccess {
  ok: true;
  coupon: Coupon;
  /** Descuento en soles sobre los productos */
  discount: number;
  freeShipping: boolean;
  /** Soles de descuento en el envío */
  shippingDiscount: number;
  gift?: GiftReward;
  /** % aplicado (percent / tiered / percentItem), para mostrarlo */
  percent?: number;
}

export type CouponResult =
  CouponSuccess | ({ ok: false; coupon?: Coupon } & CouponFailure);

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Fecha, día de la semana, día del mes y hora en Lima */
export function limaClock(d: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      weekday: "short",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;
  return {
    date,
    time,
    stamp: `${date} ${time}`,
    weekday: days.indexOf(parts.weekday),
    monthDay: Number(parts.day),
    /** Último día del mes (para "fin de mes") */
    lastDay: new Date(Number(parts.year), Number(parts.month), 0).getDate(),
  };
}

export const normalizeCode = (code: string) => code.trim().toUpperCase();

/* Aviso si dos cupones comparten código o alias (se usa el primero) */
{
  const seen = new Set<string>();
  for (const c of COUPONS) {
    for (const code of [c.code, ...(c.aliases ?? [])]) {
      if (seen.has(code)) console.error(`[cupones] código repetido: ${code}`);
      seen.add(code);
    }
  }
}

export function findCoupon(code: string) {
  const c = normalizeCode(code);
  return COUPONS.find(
    (x) => x.active !== false && (x.code === c || x.aliases?.includes(c)),
  );
}

/** ¿El cupón necesita el registro de usos? */
export const tracksUsage = (c: Coupon) => {
  const r = c.rules ?? {};
  return !!(
    r.maxUses ||
    r.maxUsesPerCustomer ||
    r.maxUsesPerDay ||
    r.budget ||
    r.firstPurchase ||
    r.minPreviousOrders
  );
};

/** Ediciones que trae una línea (un combo puede mezclar varias) */
function editionsOf(line: CouponLine) {
  /* La edición actual del café (se puede haber movido de edición) */
  if (line.categoryId !== COMBO_CATEGORY) return [productCategory(line.productId) ?? line.categoryId];
  return findCombo(line.productId)?.items.map((i) => productCategory(i.productId) ?? i.categoryId) ?? [];
}

function productsOf(line: CouponLine) {
  if (line.categoryId !== COMBO_CATEGORY) return [line.productId];
  return findCombo(line.productId)?.items.map((i) => i.productId) ?? [];
}

/** Cafés que representa una línea (un combo trae varios) */
function coffeesIn(line: CouponLine) {
  if (line.categoryId !== COMBO_CATEGORY) return line.qty;
  return line.qty * (findCombo(line.productId)?.items.length ?? 1);
}

function isEligible(line: CouponLine, r: CouponRules) {
  const combo = line.categoryId === COMBO_CATEGORY;
  if (combo && r.excludeCombos) return false;
  if (!combo && r.onlyCombos) return false;
  const editions = editionsOf(line);
  const products = productsOf(line);
  if (r.editions && !editions.every((e) => r.editions!.includes(e)))
    return false;
  if (r.excludeEditions && editions.some((e) => r.excludeEditions!.includes(e)))
    return false;
  if (
    r.products &&
    !r.products.includes(line.productId) &&
    !products.every((p) => r.products!.includes(p))
  )
    return false;
  if (
    r.excludeProducts &&
    (r.excludeProducts.includes(line.productId) ||
      products.some((p) => r.excludeProducts!.includes(p)))
  )
    return false;
  if (r.sizes && !r.sizes.includes(line.size)) return false;
  if (r.grinds && (!line.grind || !r.grinds.includes(line.grind))) return false;
  return true;
}

/** ¿El cliente está en la lista? (correo exacto, dominio o documento) */
function inList(list: CustomerList, customer: CouponContext["customer"]) {
  const email = customer?.email?.trim().toLowerCase() ?? "";
  const doc = customer?.document?.trim() ?? "";
  if (email && list.emails?.some((e) => e.toLowerCase() === email)) return true;
  if (
    email &&
    list.domains?.some((d) =>
      email.endsWith(`@${d.replace(/^@/, "").toLowerCase()}`),
    )
  )
    return true;
  return !!doc && !!list.documents?.includes(doc);
}

/** ¿La hora está dentro del horario? (admite cruzar la medianoche) */
function inHours(time: string, h: { from: string; to: string }) {
  return h.from <= h.to
    ? time >= h.from && time <= h.to
    : time >= h.from || time <= h.to;
}

/** Fecha con hora opcional → comparable con clock.stamp */
const asStamp = (v: string, end: boolean) =>
  v.length > 10 ? v : `${v} ${end ? "23:59" : "00:00"}`;

/** Evalúa un código contra el carrito: premio en soles o el motivo del rechazo */
export function evaluateCoupon(code: string, ctx: CouponContext): CouponResult {
  const coupon = findCoupon(code);
  if (!coupon) return { ok: false, reason: "not_found" };
  return evaluate(coupon, ctx);
}

function evaluate(coupon: Coupon, ctx: CouponContext): CouponResult {
  const r = coupon.rules ?? {};
  const fail = (f: CouponFailure): CouponResult => ({
    ok: false,
    coupon,
    ...f,
  });

  /* ── Vigencia y horario (hora de Lima) ── */
  const clock = limaClock(ctx.now ?? new Date());
  if (r.validFrom && clock.stamp < asStamp(r.validFrom, false))
    return fail({ reason: "not_started" });
  if (r.validUntil && clock.stamp > asStamp(r.validUntil, true))
    return fail({ reason: "expired" });
  if (r.dates && !r.dates.includes(clock.date))
    return fail({ reason: "schedule" });
  if (
    r.monthDays &&
    !r.monthDays.some((d) =>
      d === -1 ? clock.monthDay === clock.lastDay : d === clock.monthDay,
    )
  )
    return fail({ reason: "schedule" });
  if (r.daysOfWeek && !r.daysOfWeek.includes(clock.weekday))
    return fail({ reason: "schedule" });
  if (r.hours && !inHours(clock.time, r.hours))
    return fail({ reason: "schedule" });

  /* ── Cliente ── */
  if (r.locales && !r.locales.includes(ctx.locale ?? ""))
    return fail({ reason: "unavailable" });
  if (r.excludeCustomers && inList(r.excludeCustomers, ctx.customer))
    return fail({ reason: "unavailable" });
  if (r.customers && !inList(r.customers, ctx.customer))
    return fail({ reason: "customer_only" });
  if (r.wholesale && ctx.receiptType !== "factura")
    return fail({ reason: "wholesale" });
  if (r.consumerOnly && ctx.receiptType !== "boleta")
    return fail({ reason: "consumer_only" });
  if (r.newsletter && !ctx.customer?.newsletter)
    return fail({ reason: "newsletter" });

  /* ── Pago y envío ── */
  if (
    r.paymentMethods &&
    (!ctx.payment || !r.paymentMethods.includes(ctx.payment))
  )
    return fail({ reason: "payment_method", methods: r.paymentMethods });
  if (r.zones) {
    const zone = ctx.department ? shippingZone(ctx.department) : null;
    if (!zone || !r.zones.includes(zone))
      return fail({ reason: "zone", zones: r.zones });
  }
  if (r.departments && !r.departments.includes(ctx.department))
    return fail({ reason: "department", departments: r.departments });
  if (r.excludeDepartments?.includes(ctx.department))
    return fail({
      reason: "excluded_department",
      departments: r.excludeDepartments,
    });

  /* ── Carrito ── */
  if (r.minSubtotal && ctx.subtotal < r.minSubtotal)
    return fail({ reason: "min_subtotal", amount: r.minSubtotal });
  if (r.maxSubtotal && ctx.subtotal > r.maxSubtotal)
    return fail({ reason: "max_subtotal", amount: r.maxSubtotal });

  /* Cantidades por producto (un combo suma los productos que trae) */
  const perProduct = new Map<string, number>();
  for (const l of ctx.lines) {
    for (const p of productsOf(l))
      perProduct.set(p, (perProduct.get(p) ?? 0) + l.qty);
    if (l.categoryId === COMBO_CATEGORY)
      perProduct.set(l.productId, (perProduct.get(l.productId) ?? 0) + l.qty);
  }
  const required = {
    ...Object.fromEntries((r.requireProducts ?? []).map((p) => [p, 1])),
    ...r.requireQty,
  };
  const missing = Object.entries(required).filter(
    ([p, n]) => (perProduct.get(p) ?? 0) < n,
  );
  if (missing.length > 0)
    return fail({
      reason: "required_products",
      products: Object.keys(required),
    });

  const eligible = ctx.lines.filter((l) => isEligible(l, r));
  const restricted = !!(
    r.editions ||
    r.excludeEditions ||
    r.products ||
    r.excludeProducts ||
    r.sizes ||
    r.grinds ||
    r.excludeCombos ||
    r.onlyCombos
  );
  if (restricted && eligible.length === 0)
    return fail({
      reason: "no_eligible",
      editions: r.editions,
      sizes: r.sizes,
    });

  const qty = eligible.reduce((s, l) => s + coffeesIn(l), 0);
  if (r.minQty && qty < r.minQty)
    return fail({ reason: "min_qty", count: r.minQty });
  if (r.maxQty && qty > r.maxQty)
    return fail({ reason: "max_qty", count: r.maxQty });
  if (r.minDistinct) {
    const distinct = new Set(eligible.flatMap(productsOf)).size;
    if (distinct < r.minDistinct)
      return fail({ reason: "min_distinct", count: r.minDistinct });
  }

  /* ── Límites de uso (solo en el servidor) ── */
  if (ctx.usage !== undefined && tracksUsage(coupon)) {
    if (ctx.usage === null) return fail({ reason: "unavailable" });
    const u = ctx.usage;
    const code = coupon.code;
    if (r.firstPurchase && u.customerOrders > 0)
      return fail({ reason: "first_purchase" });
    if (r.minPreviousOrders && u.customerOrders < r.minPreviousOrders)
      return fail({ reason: "loyalty", count: r.minPreviousOrders });
    if (r.maxUses && (u.uses[code] ?? 0) >= r.maxUses)
      return fail({ reason: "used_up" });
    if (r.budget && (u.spent?.[code] ?? 0) >= r.budget)
      return fail({ reason: "used_up" });
    if (r.maxUsesPerDay && (u.dayUses?.[code] ?? 0) >= r.maxUsesPerDay)
      return fail({ reason: "used_up_today" });
    if (
      r.maxUsesPerCustomer &&
      (u.customerUses[code] ?? 0) >= r.maxUsesPerCustomer
    )
      return fail({ reason: "already_used" });
  }

  /* ── Premio ── */
  /* Bolsas que reciben el descuento, de la más barata a la más cara.
     Con maxDiscountedUnits solo cuentan las N más caras. */
  const allUnits = eligible
    .flatMap((l) => Array<number>(l.qty).fill(l.unitPrice))
    .sort((a, b) => a - b);
  const capped = r.maxDiscountedUnits
    ? allUnits.slice(-r.maxDiscountedUnits)
    : allUnits;
  const base = round2(capped.reduce((s, p) => s + p, 0));
  /* Bolsas sueltas (sin combos) para premios por unidad */
  const looseUnits = () => {
    const u = eligible
      .filter((l) => l.categoryId !== COMBO_CATEGORY)
      .flatMap((l) => Array<number>(l.qty).fill(l.unitPrice))
      .sort((a, b) => a - b);
    return r.maxDiscountedUnits ? u.slice(-r.maxDiscountedUnits) : u;
  };
  const rate = ctx.shippingRate ?? 0;
  const ok = (
    discount: number,
    extra: Partial<CouponSuccess> = {},
  ): CouponSuccess => {
    const capTotal = r.maxDiscount ?? Infinity;
    return {
      ok: true,
      coupon,
      discount: round2(Math.max(0, Math.min(discount, base, capTotal))),
      freeShipping: false,
      shippingDiscount: 0,
      ...extra,
    };
  };

  const reward = coupon.reward;
  switch (reward.type) {
    case "percent": {
      const raw = (base * reward.value) / 100;
      return ok(reward.maxDiscount ? Math.min(raw, reward.maxDiscount) : raw, {
        percent: reward.value,
      });
    }
    case "fixed":
      return ok(reward.value);
    case "fixedPer": {
      const times = Math.floor(base / reward.every);
      if (times === 0)
        return fail({ reason: "min_subtotal", amount: reward.every });
      return ok(times * reward.value);
    }
    case "percentItem": {
      const u = looseUnits();
      if (u.length === 0) return fail({ reason: "no_eligible" });
      const price = reward.target === "cheapest" ? u[0] : u[u.length - 1];
      return ok((price * reward.value) / 100, { percent: reward.value });
    }
    case "fixedPrice":
      return ok(
        looseUnits().reduce((s, p) => s + Math.max(p - reward.price, 0), 0),
      );
    case "buyXgetY": {
      const u = looseUnits();
      const group = reward.buy + reward.get;
      const discounted = Math.floor(u.length / group) * reward.get;
      if (discounted === 0) return fail({ reason: "min_qty", count: group });
      const pct = reward.discount ?? 100;
      return ok(
        (u.slice(0, discounted).reduce((s, p) => s + p, 0) * pct) / 100,
        pct < 100 ? { percent: pct } : {},
      );
    }
    case "tiered": {
      const measure = reward.by === "amount" ? base : qty;
      const tier = [...reward.tiers]
        .sort((a, b) => b.min - a.min)
        .find((t) => measure >= t.min);
      if (!tier) {
        const min = Math.min(...reward.tiers.map((t) => t.min));
        return reward.by === "amount"
          ? fail({ reason: "min_subtotal", amount: min })
          : fail({ reason: "min_qty", count: min });
      }
      return ok((base * tier.percent) / 100, { percent: tier.percent });
    }
    case "freeShipping":
      return ok(0, { freeShipping: true });
    case "shippingDiscount":
      return ok(0, { shippingDiscount: reward.value });
    case "shippingPercent":
      return ok(0, {
        shippingDiscount: round2((rate * reward.value) / 100),
        percent: reward.value,
      });
    case "shippingFixed":
      return ok(0, { shippingDiscount: Math.max(rate - reward.price, 0) });
    case "gift":
      return ok(0, { gift: reward });
  }
}

/** Precio de catálogo del regalo (para comparar promociones) */
function giftValue(g?: GiftReward) {
  if (!g) return 0;
  return (
    (findProduct(g.categoryId, g.productId)?.prices[g.size] ?? 0) * (g.qty ?? 1)
  );
}

/** Ahorro total de un resultado, para elegir la mejor promoción */
function savings(r: CouponSuccess, rate: number) {
  const shipping = r.freeShipping ? rate : Math.min(r.shippingDiscount, rate);
  return r.discount + shipping + giftValue(r.gift);
}

const total = (rs: CouponSuccess[], rate: number) =>
  rs.reduce((s, r) => s + savings(r, rate), 0);

/**
 * Cupón escrito + promociones automáticas → lo que se aplica.
 * - Las apilables (stackable) se suman entre sí.
 * - Entre las no apilables gana la de mayor ahorro.
 * - Una exclusiva no se combina con nada: se aplica sola si ahorra más
 *   que la mejor combinación.
 * Si el cupón escrito queda fuera, se informa "better_promo".
 */
export function resolveCoupons(
  code: string | undefined,
  ctx: CouponContext,
): { applied: CouponSuccess[]; manual: CouponResult | null } {
  const rate = ctx.shippingRate ?? 0;
  const manualCoupon = code ? findCoupon(code) : undefined;
  const auto = COUPONS.filter((c) => c.autoApply && c.active !== false)
    .filter((c) => c !== manualCoupon)
    .map((c) => evaluate(c, ctx))
    .filter((r): r is CouponSuccess => r.ok);
  let manual = code ? evaluateCoupon(code, ctx) : null;

  const all = [...auto, ...(manual?.ok ? [manual] : [])];
  const normal = all.filter((r) => !r.coupon.exclusive);
  const stackable = normal.filter((r) => r.coupon.stackable);
  const bestSingle = normal
    .filter((r) => !r.coupon.stackable)
    .sort((a, b) => savings(b, rate) - savings(a, rate))[0];
  let applied = bestSingle ? [...stackable, bestSingle] : stackable;

  const bestExclusive = all
    .filter((r) => r.coupon.exclusive)
    .sort((a, b) => savings(b, rate) - savings(a, rate))[0];
  if (bestExclusive && savings(bestExclusive, rate) >= total(applied, rate)) {
    applied = [bestExclusive];
  }

  if (manual?.ok && !applied.includes(manual)) {
    manual = { ok: false, coupon: manual.coupon, reason: "better_promo" };
  }
  return { applied, manual };
}
