import "server-only";
import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { db, dbReady } from "@/src/lib/db/supabase";
import {
  baseCategories,
  baseCombos,
  baseCoupons,
  buildCatalog,
  buildCombos,
} from "@/src/lib/site-data/apply";
import {
  toCombo,
  toEdition,
  toProduct,
  type ComboRow,
  type EditionRow,
  type OptionRow,
  type ProductRow,
} from "@/src/lib/site-data/rows";
import type { Coupon } from "@/src/lib/coupons";
import {
  CODE_SIZES,
  DEFAULT_SHOP_SETTINGS,
  SIZES,
  type ShopSettings,
  type SizeSetting,
} from "@/src/lib/shop";
import { ensureSiteData } from "@/src/lib/site-data/load";
import { COMBOS, comboItemSize } from "@/src/components/product-showcase/data";
import type { FormulaCatalog } from "@/src/lib/coupons/formula";
import {
  DEFAULT_CONTACT,
  DEFAULT_PROMO,
  type ContactSettings,
  type PromoSettings,
} from "@/src/lib/site";
import { SOLD_STATUSES, type OrderRow, type OrderStatus } from "./orders-store";
import type { MessageRow, MessageStatus } from "./messages-store";
import type { AuditRow } from "./audit";

/* ───────────────────────────────────────────────────────────────
   Lecturas del panel: siempre frescas (sin caché). Si la base no está
   conectada, devuelven listas vacías o los datos del código.
─────────────────────────────────────────────────────────────── */

const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  if (!dbReady()) return fallback;
  try {
    return await fn();
  } catch (e) {
    console.error("[admin]", e);
    return fallback;
  }
};

/** Para los filtros de PostgREST: sin comas ni paréntesis */
const clean = (s: string) => s.replace(/[,()*%\\]/g, " ").trim().slice(0, 80);

/* ───────── Avisos del menú ───────── */

async function panelBadgesUncached() {
  return safe(
    async () => {
      const [orders, messages] = await Promise.all([
        db.select<{ id: string }>("orders", { select: "id", status: "eq.paid", limit: 500 }),
        db.select<{ id: string }>("messages", { select: "id", status: "eq.new", limit: 500 }),
      ]);
      return { orders: orders.length, messages: messages.length };
    },
    { orders: 0, messages: 0 },
  );
}

/* ───────── Pedidos ───────── */

export interface OrderFilters {
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  payment?: string;
  page?: number;
}

export const ORDERS_PAGE = 30;

export async function listOrders(f: OrderFilters) {
  return safe(
    async () => {
      const q = f.q ? clean(f.q) : "";
      const page = Math.max(1, f.page ?? 1);
      const rows = await db.select<OrderRow>("orders", {
        select:
          "id,number,created_at,status,payment_method,customer,total,items,address,coupons",
        order: "created_at.desc",
        limit: ORDERS_PAGE + 1,
        offset: (page - 1) * ORDERS_PAGE,
        ...(f.status && f.status !== "all" && {
          status:
            f.status === "sold"
              ? `in.(${SOLD_STATUSES.join(",")})`
              : `eq.${f.status}`,
        }),
        ...(f.payment && { payment_method: `eq.${f.payment}` }),
        ...(q && {
          or: `(number.ilike.*${q}*,customer->>email.ilike.*${q}*,customer->>firstName.ilike.*${q}*,customer->>lastName.ilike.*${q}*,customer->>phone.ilike.*${q}*)`,
        }),
        ...(f.from && f.to
          ? { and: `(created_at.gte.${f.from}T00:00:00-05:00,created_at.lte.${f.to}T23:59:59-05:00)` }
          : f.from
            ? { created_at: `gte.${f.from}T00:00:00-05:00` }
            : f.to
              ? { created_at: `lte.${f.to}T23:59:59-05:00` }
              : {}),
      });
      return { rows: rows.slice(0, ORDERS_PAGE), more: rows.length > ORDERS_PAGE };
    },
    { rows: [] as OrderRow[], more: false },
  );
}

export async function getOrder(number: string) {
  return safe(() => db.one<OrderRow>("orders", { number: `eq.${number}` }), null);
}

/** Todos los pedidos que cumplen el filtro (para exportar) */
export async function exportOrders(f: OrderFilters) {
  return safe(async () => {
    const all: OrderRow[] = [];
    for (let page = 1; page <= 100; page++) {
      const { rows, more } = await listOrders({ ...f, page });
      all.push(...rows);
      if (!more) break;
    }
    return all;
  }, [] as OrderRow[]);
}

/* ───────── Resumen ───────── */

async function dashboardUncached() {
  const since = new Date(Date.now() - 90 * 86400_000).toISOString();
  /* Pedidos y mensajes a la vez */
  const [orders, messages] = await Promise.all([
    safe(
      () =>
        db.select<OrderRow>("orders", {
          select: "number,created_at,status,payment_method,total,items,coupons,customer",
          created_at: `gte.${since}`,
          order: "created_at.desc",
          limit: 5000,
        }),
      [] as OrderRow[],
    ),
    safe(
      () =>
        db.select<MessageRow>("messages", {
          select: "id,created_at,name,type,status",
          order: "created_at.desc",
          limit: 5,
        }),
      [] as MessageRow[],
    ),
  ]);

  const sold = orders.filter((o) => SOLD_STATUSES.includes(o.status));
  /* Días según la hora de Lima */
  const limaDay = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  const today = limaDay(new Date());
  const daysAgo = (n: number) => limaDay(new Date(Date.now() - n * 86400_000));
  const sum = (list: OrderRow[]) => list.reduce((s, o) => s + Number(o.total), 0);
  const inLast = (n: number) => sold.filter((o) => limaDay(o.created_at) > daysAgo(n));

  const byDay = Array.from({ length: 30 }, (_, i) => {
    const day = daysAgo(29 - i);
    const list = sold.filter((o) => limaDay(o.created_at) === day);
    return { day, total: sum(list), count: list.length };
  });

  const products = new Map<string, { name: string; qty: number; total: number }>();
  const coupons = new Map<string, { uses: number; discount: number }>();
  for (const o of sold) {
    for (const i of o.items) {
      const p = products.get(i.name) ?? { name: i.name, qty: 0, total: 0 };
      p.qty += i.qty;
      p.total += Number(i.lineTotal);
      products.set(i.name, p);
    }
    for (const c of o.coupons) {
      const k = coupons.get(c.code) ?? { uses: 0, discount: 0 };
      k.uses += 1;
      k.discount += Number(c.discount);
      coupons.set(c.code, k);
    }
  }

  const month = inLast(30);
  return {
    connected: dbReady(),
    today: sum(sold.filter((o) => limaDay(o.created_at) === today)),
    todayCount: sold.filter((o) => limaDay(o.created_at) === today).length,
    week: sum(inLast(7)),
    month: sum(month),
    monthCount: month.length,
    avgTicket: month.length ? sum(month) / month.length : 0,
    toPrepare: orders.filter((o) => o.status === "paid").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    pending: orders.filter((o) => o.status === "pending").length,
    byDay,
    topProducts: [...products.values()].sort((a, b) => b.qty - a.qty).slice(0, 6),
    topCoupons: [...coupons.entries()]
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 6),
    payments: {
      card: month.filter((o) => o.payment_method === "card").length,
      wallet: month.filter((o) => o.payment_method === "wallet").length,
    },
    recent: orders.slice(0, 6),
    messages,
    newMessages: messages.filter((m) => m.status === "new").length,
  };
}

/* ───────── Mensajes ───────── */

export async function listMessages(f: { status?: string; type?: string; q?: string }) {
  return safe(() => {
    const q = f.q ? clean(f.q) : "";
    return db.select<MessageRow>("messages", {
      order: "created_at.desc",
      limit: 200,
      ...(f.status && f.status !== "all" && { status: `eq.${f.status}` }),
      ...(f.type && f.type !== "all" && { type: `eq.${f.type}` }),
      ...(q && {
        or: `(name.ilike.*${q}*,email.ilike.*${q}*,company.ilike.*${q}*,message.ilike.*${q}*)`,
      }),
    });
  }, [] as MessageRow[]);
}

export async function getMessage(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return safe(() => db.one<MessageRow>("messages", { id: `eq.${id}` }), null);
}

export type { MessageStatus };

/* ───────── Productos y ediciones ───────── */

/**
 * Catálogo para el panel: ediciones y cafés (los del código con sus cambios
 * y los creados en el panel), incluidos los ocultos. Lo eliminado va aparte
 * para poder restaurarlo.
 */
async function productsViewUncached() {
  await ensureSiteData(); // presentaciones al día (SIZES)
  const t = await getTranslations({ locale: "es" });
  const text = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);
  const [productRows, editionRows, varietalLinks, processLinks] = await Promise.all([
    safe(() => db.select<ProductRow>("products"), [] as ProductRow[]),
    safe(() => db.select<EditionRow>("editions"), [] as EditionRow[]),
    optionLinks("varietals"),
    optionLinks("processes"),
  ]);
  const products = productRows.map(toProduct);
  const editions = editionRows.map(toEdition);
  const pById = new Map(products.map((p) => [p.id, p]));
  const eById = new Map(editions.map((e) => [e.id, e]));
  const base = baseCategories();
  const baseProduct = (id: string) =>
    base.flatMap((c) => c.products).find((p) => p.id === id);

  const catalog = buildCatalog(products, editions, { all: true });
  const view = catalog.map((c) => {
    const eo = eById.get(c.id);
    const codeEdition = base.find((b) => b.id === c.id);
    return {
      id: c.id,
      name: text(`editions.${c.id}.name`, c.id),
      color: c.color,
      panelBg: c.panelBg,
      panelImage: c.panelImage ?? null,
      heroTextColor: c.heroTextColor ?? null,
      headingColor: c.headingColor ?? null,
      custom: !codeEdition,
      active: eo ? eo.active : true,
      sort: eo?.sort ?? null,
      hasOverride: Boolean(eo && codeEdition),
      products: c.products.map((p) => {
        const o = pById.get(p.id);
        const code = baseProduct(p.id);
        return {
          id: p.id,
          categoryId: c.id,
          name: text(`editions.${c.id}.products.${p.id}`, p.id),
          image: p.image ?? null,
          hoverImage: p.hoverImage ?? null,
          codeImage: code?.image ?? null,
          cardBg: p.cardBg ?? c.color,
          ownCardBg: p.cardBg ?? null,
          certifications: p.certifications,
          /* Varietales y procesos que tiene (con "visible al cliente") */
          varietals: varietalLinks.get(p.id) ?? [],
          processes: processLinks.get(p.id) ?? [],
          active: o ? o.active : true,
          custom: !code,
          prices: p.prices,
          codePrices: code?.prices ?? null,
          stock: p.stock ?? {},
          /* Agotado a mano (todo el café o algunas presentaciones) */
          soldOut: Boolean(p.soldOut),
          soldOutSizes: p.soldOutSizes ?? [],
          sort: o?.sort ?? null,
          hasOverride: Boolean(o && code),
        };
      }),
    };
  });
  return view;
}

/** Presentaciones a la venta con su nombre en español */
async function sizesViewUncached() {
  await ensureSiteData();
  const t = await getTranslations({ locale: "es" });
  const saved = await safe(
    () => db.one<{ value: SizeSetting[] }>("settings", { key: "eq.sizes" }),
    null,
  );
  const sorts = new Map((saved?.value ?? []).map((s) => [s.id, s.sort ?? null]));
  return SIZES.map((id) => ({
    id,
    label: t.has(`shop.sizes.${id}`) ? t(`shop.sizes.${id}`) : id,
    code: (CODE_SIZES as readonly string[]).includes(id),
    sort: sorts.get(id) ?? null,
  }));
}

/** Lo que una fórmula de cupón puede nombrar: ediciones, cafés, combos y presentaciones */
async function formulaCatalogUncached(): Promise<FormulaCatalog> {
  const [editions, sizes] = await Promise.all([productsView(), sizesView()]);
  const t = await getTranslations({ locale: "es" });
  return {
    editions: editions.map((e) => ({ id: e.id, name: e.name })),
    products: [
      ...editions.flatMap((e) => e.products.map((p) => ({ id: p.id, name: p.name, editionId: e.id }))),
      ...COMBOS.map((c) => ({
        id: c.id,
        name: t.has(`cart.combos.${c.id}.name`) ? t(`cart.combos.${c.id}.name`) : c.id,
        editionId: "combo",
      })),
    ],
    sizes: sizes.map((s) => ({ id: s.id, label: s.label })),
  };
}

/** Varietales o procesos de la lista del panel, con su nombre en español */
type OptionKind = "varietals" | "processes";
const LINK_TABLE = { varietals: "product_varietals", processes: "product_processes" } as const;
const LINK_COL = { varietals: "varietal_id", processes: "process_id" } as const;

/** Qué varietales o procesos tiene cada café: productId → [{ id, active }] */
async function optionLinksUncached(kind: OptionKind) {
  const rows = await safe(
    () => db.select<Record<string, unknown>>(LINK_TABLE[kind], { order: "sort.asc.nullslast" }),
    [] as Record<string, unknown>[],
  );
  const out = new Map<string, { id: string; active: boolean; soldOut: boolean }[]>();
  for (const r of rows) {
    const list = out.get(String(r.product_id)) ?? [];
    list.push({ id: String(r[LINK_COL[kind]]), active: Boolean(r.active), soldOut: Boolean(r.sold_out) });
    out.set(String(r.product_id), list);
  }
  return out;
}

/** Lista de varietales o procesos (incluidas las inactivas), con su nombre
 *  en español y los cafés que la tienen */
async function coffeeOptionsViewUncached(kind: OptionKind) {
  const t = await getTranslations({ locale: "es" });
  const [rows, links, editions] = await Promise.all([
    safe(() => db.select<OptionRow>(kind, { order: "sort.asc.nullslast,created_at.asc" }), [] as OptionRow[]),
    optionLinks(kind),
    productsView(),
  ]);
  const coffees = editions.flatMap((e) => e.products.map((p) => ({ id: p.id, name: p.name, edition: e.name, image: p.image, cardBg: p.cardBg })));
  return rows.map((r) => ({
    id: r.id,
    label: t.has(`shop.${kind}.${r.id}`) ? t(`shop.${kind}.${r.id}`) : r.id,
    active: r.active,
    sort: r.sort,
    /* Cafés que la tienen, con su interruptor "visible al cliente" */
    coffees: coffees.flatMap((c) => {
      const l = links.get(c.id)?.find((x) => x.id === r.id);
      return l ? [{ ...c, visible: l.active }] : [];
    }),
  }));
}

export type CoffeeOptionView = Awaited<ReturnType<typeof coffeeOptionsView>>[number];

export type SizeView = Awaited<ReturnType<typeof sizesView>>[number];

export type EditionView = Awaited<ReturnType<typeof productsView>>[number];
export type ProductView = EditionView["products"][number];

/** Cafés y ediciones eliminados (para restaurarlos) */
async function deletedCatalogUncached() {
  const t = await getTranslations({ locale: "es" });
  const text = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);
  const [productRows, editionRows] = await Promise.all([
    safe(() => db.select<ProductRow>("products", { deleted: "eq.true" }), [] as ProductRow[]),
    safe(() => db.select<EditionRow>("editions", { deleted: "eq.true" }), [] as EditionRow[]),
  ]);
  return {
    products: productRows.map((r) => ({
      id: r.id,
      name: text(`editions.${r.category_id}.products.${r.id}`, r.id),
      edition: text(`editions.${r.category_id}.name`, r.category_id),
    })),
    editions: editionRows.map((r) => ({ id: r.id, name: text(`editions.${r.id}.name`, r.id) })),
  };
}

/* ───────── Combos ───────── */

/** Combos para el panel (incluidos los pausados), con sus cafés y precios */
async function combosViewUncached() {
  const [editions, rows] = await Promise.all([
    productsView(),
    safe(() => db.select<ComboRow>("combos"), [] as ComboRow[]),
  ]);
  const t = await getTranslations({ locale: "es" });
  const overrides = rows.map(toCombo);
  const byId = new Map(overrides.map((o) => [o.id, o]));
  const products = editions.flatMap((e) =>
    e.products.map((p) => ({ ...p, editionName: e.name, editionActive: e.active })),
  );
  return buildCombos(overrides, { all: true }).map((c) => {
    const o = byId.get(c.id);
    const items = c.items.map((i) => {
      const p = products.find((x) => x.id === i.productId && x.categoryId === i.categoryId);
      return {
        ...i,
        name: p?.name ?? i.productId,
        image: p?.image ?? null,
        cardBg: p?.cardBg ?? "#1E1E1E",
        size: comboItemSize(i),
        sizeLabel: t.has(`shop.sizes.${comboItemSize(i)}`) ? t(`shop.sizes.${comboItemSize(i)}`) : comboItemSize(i),
        price: Number(p?.prices[comboItemSize(i)] ?? 0),
        /* Un café oculto (o de una edición oculta), o que ya no se vende en
           esa presentación, esconde el combo en la web */
        available: Boolean(p && p.active && p.editionActive && Number(p.prices[comboItemSize(i)]) > 0),
      };
    });
    const regular = items.reduce((sum, i) => sum + i.price, 0);
    return {
      id: c.id,
      name: t.has(`cart.combos.${c.id}.name`) ? t(`cart.combos.${c.id}.name`) : c.id,
      discount: c.discount,
      items,
      regular,
      price: Math.round(regular * (100 - c.discount)) / 100,
      custom: !baseCombos().some((b) => b.id === c.id),
      active: o ? o.active : true,
      hidden: items.some((i) => !i.available),
      sort: o?.sort ?? null,
    };
  });
}

export type ComboView = Awaited<ReturnType<typeof combosView>>[number];

/** Combos eliminados (los del código, para restaurarlos) */
async function deletedCombosUncached() {
  const t = await getTranslations({ locale: "es" });
  const rows = await safe(() => db.select<ComboRow>("combos", { deleted: "eq.true" }), [] as ComboRow[]);
  return rows.map((r) => ({ id: r.id, name: t.has(`cart.combos.${r.id}.name`) ? t(`cart.combos.${r.id}.name`) : r.id }));
}

/* ───────── Cupones ───────── */

type CouponRow = { code: string; data: Coupon; deleted: boolean; updated_at: string };

export interface CouponView {
  code: string;
  coupon: Coupon;
  origin: "code" | "panel" | "both";
  hidden: boolean;
  uses: number;
  discount: number;
}

async function couponsViewUncached(): Promise<CouponView[]> {
  const [rows, orders] = await Promise.all([
    safe(() => db.select<CouponRow>("coupons"), [] as CouponRow[]),
    safe(
      () =>
        db.select<OrderRow>("orders", {
          select: "coupons,status",
          status: `in.(${SOLD_STATUSES.join(",")})`,
          limit: 10000,
        }),
      [] as OrderRow[],
    ),
  ]);
  const stats = new Map<string, { uses: number; discount: number }>();
  for (const o of orders)
    for (const c of o.coupons) {
      const s = stats.get(c.code.toUpperCase()) ?? { uses: 0, discount: 0 };
      s.uses += 1;
      s.discount += Number(c.discount);
      stats.set(c.code.toUpperCase(), s);
    }
  const panel = new Map(rows.map((r) => [r.code.toUpperCase(), r]));
  const list: CouponView[] = baseCoupons().map((c) => {
    const r = panel.get(c.code.toUpperCase());
    panel.delete(c.code.toUpperCase());
    return {
      code: c.code,
      coupon: r && !r.deleted ? r.data : c,
      origin: r ? "both" : "code",
      hidden: Boolean(r?.deleted),
      ...(stats.get(c.code.toUpperCase()) ?? { uses: 0, discount: 0 }),
    };
  });
  for (const r of panel.values())
    if (!r.deleted)
      list.push({
        code: r.code,
        coupon: r.data,
        origin: "panel",
        hidden: false,
        ...(stats.get(r.code.toUpperCase()) ?? { uses: 0, discount: 0 }),
      });
  return list.sort((a, b) => a.code.localeCompare(b.code));
}

export async function couponView(code: string) {
  return (await couponsView()).find((c) => c.code.toUpperCase() === code.toUpperCase()) ?? null;
}

async function listTextOverridesUncached() {
  return safe(
    () => db.select<{ locale: string; key: string; value: string; updated_at: string }>("i18n_overrides"),
    [] as { locale: string; key: string; value: string; updated_at: string }[],
  );
}

/* ───────── Ajustes ───────── */

async function settingsViewUncached() {
  const rows = await safe(
    () => db.select<{ key: string; value: unknown }>("settings"),
    [] as { key: string; value: unknown }[],
  );
  const get = <T,>(k: string, d: T) => (rows.find((r) => r.key === k)?.value as T) ?? d;
  return {
    shop: get<ShopSettings>("shop", DEFAULT_SHOP_SETTINGS),
    contact: get<ContactSettings>("contact", DEFAULT_CONTACT),
    promo: get<PromoSettings>("promo", DEFAULT_PROMO),
    /* Traducción manual (campos por idioma) o automática con Claude */
    translation: get<{ manual: boolean }>("translation", { manual: false }),
  };
}

/* ───────── Actividad ───────── */

export async function listAudit() {
  return safe(
    () => db.select<AuditRow>("audit_log", { order: "at.desc", limit: 300 }),
    [] as AuditRow[],
  );
}

export type { OrderRow, OrderStatus };

/* ───────── Una sola consulta por pedido ─────────
   Una página puede pedir el mismo dato varias veces (p. ej. la ficha de un
   café usa el catálogo para el formulario, las presentaciones y las
   varietales). Con cache() se consulta una vez por petición. */
const optionLinks = cache(optionLinksUncached);
export const productsView = cache(productsViewUncached);
export const sizesView = cache(sizesViewUncached);
export const coffeeOptionsView = cache(coffeeOptionsViewUncached);
export const combosView = cache(combosViewUncached);
export const formulaCatalog = cache(formulaCatalogUncached);
export const couponsView = cache(couponsViewUncached);
export const settingsView = cache(settingsViewUncached);
export const panelBadges = cache(panelBadgesUncached);
export const dashboard = cache(dashboardUncached);
export const deletedCatalog = cache(deletedCatalogUncached);
export const deletedCombos = cache(deletedCombosUncached);
export const listTextOverrides = cache(listTextOverridesUncached);
