import "server-only";
import { revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { db, dbReady, SITE_DATA_TAG } from "@/src/lib/db/supabase";
import {
  COMBO_CATEGORY,
  comboItemSize,
  findCombo,
} from "@/src/components/product-showcase/data";
import type { CheckoutInput, PricedOrder } from "@/src/lib/checkout/order";

/* ───────────────────────────────────────────────────────────────
   Pedidos guardados en Supabase. Lo llaman el cobro, el webhook de
   Mercado Pago y la consulta de estado del 3D Secure: es seguro llamarlo
   varias veces por el mismo pedido (se identifica por su número).
   Si la base no está configurada no hace nada: el pedido igual se cobra
   y se envían los correos.
─────────────────────────────────────────────────────────────── */

export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "rejected";

/** Estados que ya pasaron por el pago (cuentan como venta) */
export const SOLD_STATUSES: OrderStatus[] = [
  "paid",
  "preparing",
  "shipped",
  "delivered",
];

export interface OrderItem {
  categoryId: string;
  productId: string;
  name: string;
  size: string;
  grind: string;
  /** Varietal y proceso elegidos (ids) y sus nombres en español */
  varietal?: string;
  process?: string;
  options?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderRow {
  id: string;
  number: string;
  created_at: string;
  updated_at: string;
  status: OrderStatus;
  payment_id: string | null;
  payment_method: "card" | "wallet" | null;
  payment_status: string | null;
  locale: string | null;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    document: string;
    newsletter: boolean;
  };
  address: CheckoutInput["address"];
  receipt: CheckoutInput["receipt"];
  items: OrderItem[];
  gifts: OrderItem[];
  coupons: { code: string; discount: number; percent?: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  refunded_amount: number;
  carrier: string | null;
  tracking_code: string | null;
  notes: string | null;
  stock_applied: boolean;
  history: { at: string; status: OrderStatus; by: string; note?: string }[];
}

/** Estado de Mercado Pago → estado del pedido */
export function statusFromPayment(mp: string | undefined): OrderStatus | null {
  switch (mp) {
    case "approved":
    case "authorized":
      return "paid";
    case "in_process":
    case "pending":
      return "pending";
    case "rejected":
    case "cancelled":
      return "rejected";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return null;
  }
}

async function itemsWithNames(
  lines: (Omit<OrderItem, "name" | "unitPrice" | "lineTotal"> & {
    unitPrice?: number;
    lineTotal?: number;
  })[],
): Promise<OrderItem[]> {
  const t = await getTranslations({ locale: "es" });
  return lines.map((l) => {
    let name = l.productId;
    try {
      name =
        l.categoryId === COMBO_CATEGORY
          ? t(`cart.combos.${l.productId}.name`)
          : t(`editions.${l.categoryId}.products.${l.productId}`);
    } catch {
      /* sin traducción: queda el id */
    }
    const optName = (kind: string, id?: string) =>
      id ? (t.has(`shop.${kind}.${id}`) ? t(`shop.${kind}.${id}`) : id) : null;
    const options = [optName("varietals", l.varietal), optName("processes", l.process)]
      .filter(Boolean)
      .join(" · ");
    return {
      categoryId: l.categoryId,
      productId: l.productId,
      name,
      size: l.size,
      grind: l.grind,
      ...(l.varietal && { varietal: l.varietal }),
      ...(l.process && { process: l.process }),
      ...(options && { options }),
      qty: l.qty,
      unitPrice: l.unitPrice ?? 0,
      lineTotal: l.lineTotal ?? 0,
    };
  });
}

/**
 * Crea o actualiza el pedido. Un pedido que ya avanzó (preparando,
 * enviado…) no retrocede por una notificación tardía del pago.
 */
export async function saveOrder(args: {
  input: CheckoutInput;
  priced: PricedOrder;
  orderNumber: string;
  paymentId: string;
  paymentStatus: string;
}) {
  if (!dbReady() || !args.orderNumber) return;
  const { input, priced, orderNumber, paymentId, paymentStatus } = args;
  const status = statusFromPayment(paymentStatus) ?? "pending";
  try {
    const existing = await db.one<OrderRow>("orders", {
      number: `eq.${orderNumber}`,
    });
    const now = new Date().toISOString();
    if (existing) {
      const canMove =
        existing.status === "pending" ||
        (existing.status === "rejected" && status === "paid") ||
        status === "refunded";
      await db.update(
        "orders",
        { number: `eq.${orderNumber}` },
        {
          payment_id: paymentId,
          payment_status: paymentStatus,
          updated_at: now,
          ...(canMove &&
            existing.status !== status && {
              status,
              history: [
                ...existing.history,
                { at: now, status, by: "Mercado Pago" },
              ],
            }),
        },
      );
    } else {
      await db.insert("orders", {
        number: orderNumber,
        status,
        payment_id: paymentId,
        payment_method: input.payment,
        payment_status: paymentStatus,
        locale: input.locale,
        customer: {
          ...input.customer,
          document:
            input.receipt.type === "factura"
              ? input.receipt.ruc
              : input.receipt.document,
        },
        address: input.address,
        receipt: input.receipt,
        items: await itemsWithNames(priced.lines),
        gifts: await itemsWithNames(priced.gifts),
        coupons: priced.coupons,
        subtotal: priced.subtotal,
        discount: priced.discountAmount,
        shipping: priced.shipping,
        total: priced.total,
        history: [{ at: now, status, by: "Mercado Pago" }],
      });
    }
    if (status === "paid") await applyStock(orderNumber);
  } catch (e) {
    console.error("[orders] no se guardó el pedido", orderNumber, e);
  }
}

/** Solo actualiza el estado de pago (p. ej. rechazo tras el 3D Secure) */
export async function updatePaymentState(
  orderNumber: string,
  paymentStatus: string,
) {
  if (!dbReady() || !orderNumber) return;
  const status = statusFromPayment(paymentStatus);
  try {
    const existing = await db.one<OrderRow>("orders", {
      number: `eq.${orderNumber}`,
    });
    if (!existing) return;
    const now = new Date().toISOString();
    const move =
      status && status !== existing.status && existing.status === "pending";
    await db.update(
      "orders",
      { number: `eq.${orderNumber}` },
      {
        payment_status: paymentStatus,
        updated_at: now,
        ...(move && {
          status,
          history: [
            ...existing.history,
            { at: now, status, by: "Mercado Pago" },
          ],
        }),
      },
    );
  } catch (e) {
    console.error("[orders] no se actualizó el pago", orderNumber, e);
  }
}

/** Descuenta del stock lo vendido (una sola vez por pedido) */
async function applyStock(orderNumber: string) {
  const order = await db.one<OrderRow>("orders", {
    number: `eq.${orderNumber}`,
  });
  if (!order || order.stock_applied) return;
  /* Se marca primero: si dos avisos llegan a la vez, solo uno descuenta */
  const claimed = await db.update<OrderRow>(
    "orders",
    { number: `eq.${orderNumber}`, stock_applied: "eq.false" },
    { stock_applied: true },
  );
  if (!claimed.length) return;
  const units = new Map<string, number>();
  const add = (productId: string, size: string, qty: number) =>
    units.set(
      `${productId}|${size}`,
      (units.get(`${productId}|${size}`) ?? 0) + qty,
    );
  for (const l of [...order.items, ...order.gifts]) {
    if (l.categoryId === COMBO_CATEGORY) {
      findCombo(l.productId)?.items.forEach((i) =>
        add(i.productId, comboItemSize(i), l.qty),
      );
    } else add(l.productId, l.size, l.qty);
  }
  await Promise.all(
    [...units].map(([key, qty]) => {
      const [productId, size] = key.split("|");
      return db.rpc("decrement_stock", {
        p_id: productId,
        p_size: size,
        p_qty: qty,
      });
    }),
  );
  /* La web pública vuelve a leer el stock */
  revalidateTag(SITE_DATA_TAG, { expire: 0 });
}
