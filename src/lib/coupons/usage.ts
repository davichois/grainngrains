import "server-only";
import { createHash } from "node:crypto";
import { COUPONS } from "./data";
import { limaClock, tracksUsage, type CouponUsage } from "./index";

/* ───────────────────────────────────────────────────────────────
   Registro de usos de cupones en Upstash Redis (API REST, sin SDK).
   Se usa para maxUses, maxUsesPerCustomer y firstPurchase.
   Variables: UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN
   (upstash.com → Redis → tu base → REST API). Sin ellas, los cupones
   con límite de uso no se aplican (los demás funcionan igual).
─────────────────────────────────────────────────────────────── */

const PREFIX = "gg";

function config() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function pipeline(commands: (string | number)[][]) {
  const cfg = config();
  if (!cfg) throw new Error("usage_store_missing");
  const res = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return (await res.json()) as { result: unknown; error?: string }[];
}

/** Identificadores del cliente: correo y documento (hash, sin datos en claro) */
function customerKeys(customer: { email: string; document: string }) {
  const h = (v: string) =>
    createHash("sha256").update(v).digest("hex").slice(0, 32);
  return [
    customer.email && `e:${h(customer.email.trim().toLowerCase())}`,
    customer.document && `d:${h(customer.document.trim())}`,
  ].filter(Boolean) as string[];
}

/** Clave del contador diario (fecha de Lima) */
const dayKey = (code: string) =>
  `${PREFIX}:coupon:${code}:day:${limaClock(new Date()).date}`;

/**
 * Usos actuales de los cupones con límite. null si el registro no está
 * configurado o no responde (los cupones con límite no se aplican).
 */
export async function loadCouponUsage(customer: {
  email: string;
  document: string;
}): Promise<CouponUsage | null> {
  const tracked = COUPONS.filter(tracksUsage).map((c) => c.code);
  const empty: CouponUsage = {
    uses: {},
    customerUses: {},
    dayUses: {},
    spent: {},
    customerOrders: 0,
  };
  if (tracked.length === 0) return empty;
  if (!config()) return null;
  const ids = customerKeys(customer);
  const cmds: (string | number)[][] = [
    ...tracked.map((code) => ["GET", `${PREFIX}:coupon:${code}:uses`]),
    ...tracked.map((code) => ["GET", dayKey(code)]),
    ...tracked.map((code) => ["GET", `${PREFIX}:coupon:${code}:spent`]),
    ...tracked.flatMap((code) =>
      ids.map((id) => ["GET", `${PREFIX}:coupon:${code}:customer:${id}`]),
    ),
    ...ids.map((id) => ["GET", `${PREFIX}:customer:${id}:orders`]),
  ];
  try {
    const out = (await pipeline(cmds)).map((r) => Number(r.result ?? 0) || 0);
    const usage = empty;
    let i = 0;
    for (const code of tracked) usage.uses[code] = out[i++];
    for (const code of tracked) usage.dayUses![code] = out[i++];
    for (const code of tracked) usage.spent![code] = out[i++];
    for (const code of tracked) {
      /* Por correo o por documento: cuenta el mayor */
      usage.customerUses[code] = Math.max(0, ...ids.map(() => out[i++]));
    }
    usage.customerOrders = Math.max(0, ...ids.map(() => out[i++]));
    return usage;
  } catch (e) {
    console.error("[coupons] registro de usos no disponible", e);
    return null;
  }
}

/**
 * Registra un pago aprobado: pedidos del cliente, usos de cada cupón (total,
 * del día y por cliente) y soles de descuento regalados.
 * Idempotente por pago (si llega dos veces, solo cuenta una).
 */
export async function recordOrderUsage(args: {
  paymentId: string;
  coupons: { code: string; discount: number }[];
  customer: { email: string; document: string };
}) {
  if (!config()) return;
  const [first] = await pipeline([
    [
      "SET",
      `${PREFIX}:payment:${args.paymentId}`,
      "1",
      "NX",
      "EX",
      60 * 60 * 24 * 90,
    ],
  ]);
  if (first.result !== "OK") return; /* ya registrado */
  const ids = customerKeys(args.customer);
  await pipeline([
    ...ids.map((id) => ["INCR", `${PREFIX}:customer:${id}:orders`]),
    ...args.coupons.flatMap(({ code, discount }) => [
      ["INCR", `${PREFIX}:coupon:${code}:uses`],
      ["INCR", dayKey(code)],
      ["EXPIRE", dayKey(code), 60 * 60 * 48],
      ["INCRBYFLOAT", `${PREFIX}:coupon:${code}:spent`, discount],
      ...ids.map((id) => ["INCR", `${PREFIX}:coupon:${code}:customer:${id}`]),
    ]),
  ]);
}
