import "server-only";
import { db, dbReady, SITE_DATA_TAG } from "@/src/lib/db/supabase";
import type { Coupon } from "@/src/lib/coupons";
import type { ShopSettings, SizeSetting } from "@/src/lib/shop";
import type { ContactSettings, PromoSettings } from "@/src/lib/site";
import { applySiteData, EMPTY_SITE_DATA, type SiteData } from "./apply";
import {
  toCombo,
  toEdition,
  toProduct,
  type ComboRow,
  type EditionRow,
  type OptionRow,
  type ProductProcessRow,
  type ProductRow,
  type ProductVarietalRow,
} from "./rows";

/* Lo que la web pública lee de la base: en caché hasta que el panel guarde
   algo (updateTag) y, por si acaso, se renueva cada hora */
const cached = { tags: [SITE_DATA_TAG], revalidate: 3600 };

type CouponRow = { code: string; data: Coupon; deleted: boolean };
type SettingRow = { key: string; value: unknown };

/** Pequeño hash para saber si algo cambió (no es criptográfico) */
function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export async function loadSiteData(): Promise<SiteData> {
  if (!dbReady()) return EMPTY_SITE_DATA;
  try {
    const [products, editions, combos, coupons, settings, varietals, processes, pVarietals, pProcesses] = await Promise.all([
      db.select<ProductRow>("products", {}, cached),
      db.select<EditionRow>("editions", {}, cached),
      db.select<ComboRow>("combos", {}, cached),
      db.select<CouponRow>("coupons", {}, cached),
      db.select<SettingRow>("settings", {}, cached),
      db.select<OptionRow>("varietals", {}, cached),
      db.select<OptionRow>("processes", {}, cached),
      db.select<ProductVarietalRow>("product_varietals", {}, cached),
      db.select<ProductProcessRow>("product_processes", {}, cached),
    ]);
    const setting = <T,>(key: string) =>
      (settings.find((s) => s.key === key)?.value as T | undefined) ?? null;
    const data: Omit<SiteData, "version"> = {
      products: products.map(toProduct),
      editions: editions.map(toEdition),
      combos: combos.map(toCombo),
      coffeeOptions: {
        varietals: varietals.map(({ id, active, sort }) => ({ id, active, sort })),
        processes: processes.map(({ id, active, sort }) => ({ id, active, sort })),
        links: [
          ...pVarietals.map((l) => ({ productId: l.product_id, kind: "varietals" as const, optionId: l.varietal_id, active: l.active, soldOut: Boolean(l.sold_out), sort: l.sort })),
          ...pProcesses.map((l) => ({ productId: l.product_id, kind: "processes" as const, optionId: l.process_id, active: l.active, soldOut: Boolean(l.sold_out), sort: l.sort })),
        ],
      },
      coupons: coupons.map((c) => ({
        code: c.code,
        data: c.data,
        deleted: c.deleted,
      })),
      sizes: setting<SizeSetting[]>("sizes"),
      shop: setting<ShopSettings>("shop"),
      contact: setting<ContactSettings>("contact"),
      promo: setting<PromoSettings>("promo"),
    };
    return { version: hash(JSON.stringify(data)), ...data };
  } catch (e) {
    /* Si la base falla, la web sigue con los datos del código */
    console.error("[site-data] no se pudo leer la base:", e);
    return EMPTY_SITE_DATA;
  }
}

/** Carga los datos del panel y los aplica en el servidor */
export async function ensureSiteData() {
  const data = await loadSiteData();
  applySiteData(data);
  return data;
}

/** Textos editados en el panel para un idioma: { "a.b.c": "texto" } */
export async function loadTextOverrides(locale: string) {
  if (!dbReady()) return {};
  try {
    const rows = await db.select<{ key: string; value: string }>(
      "i18n_overrides",
      { locale: `eq.${locale}` },
      cached,
    );
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch (e) {
    console.error("[site-data] no se pudieron leer los textos:", e);
    return {};
  }
}

/** Mezcla los textos editados sobre los mensajes del idioma */
export function mergeTextOverrides(
  messages: Record<string, unknown>,
  overrides: Record<string, string>,
) {
  if (!Object.keys(overrides).length) return messages;
  const out = JSON.parse(JSON.stringify(messages)) as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    const parts = key.split(".");
    let node = out as Record<string, unknown>;
    for (const p of parts.slice(0, -1)) {
      const next = node[p];
      if (next === null || typeof next !== "object") node[p] = {};
      node = node[p] as Record<string, unknown>;
    }
    node[parts[parts.length - 1]] = value;
  }
  return out;
}
