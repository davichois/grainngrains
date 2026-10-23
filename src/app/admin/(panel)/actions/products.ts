"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/src/lib/admin/auth";
import { db, dbReady, SITE_DATA_TAG } from "@/src/lib/db/supabase";
import { logAudit } from "@/src/lib/admin/audit";
import { baseCategories } from "@/src/lib/site-data/apply";
import type { EditionRow, ProductRow } from "@/src/lib/site-data/rows";
import { ensureSiteData } from "@/src/lib/site-data/load";
import { driveDirect } from "@/src/lib/admin/drive";
import { dropDriveFiles } from "@/src/lib/admin/drive-files";
import { saveTexts, slugify, textsFrom, uniqueId } from "@/src/lib/admin/catalog";
import { textsFor } from "@/src/lib/admin/texts";
import { CERTIFICATIONS } from "@/src/components/product-showcase/data";
import type { CertificationId } from "@/src/components/product-showcase/types";
import {
  CODE_SIZES,
  DEFAULT_SIZE,
  SIZES,
  type SizeSetting,
} from "@/src/lib/shop";
import type { ActionState } from "./orders";

/* ───────────────────────────────────────────────────────────────
   Catálogo desde el panel: crear, editar, ocultar, eliminar y restaurar
   cafés y ediciones. Los del código no se borran de verdad (quedan como
   "eliminados" y se pueden restaurar); los creados en el panel sí.
   Los nombres van en i18n_overrides: el español es obligatorio y los
   idiomas vacíos se guardan con el texto en español.
─────────────────────────────────────────────────────────────── */

const NOT_READY = { error: "Conecta Supabase para guardar cambios." };

const str = (f: FormData, k: string, max = 300) => String(f.get(k) ?? "").trim().slice(0, max);

const findBase = (id: string) => {
  for (const c of baseCategories()) {
    const p = c.products.find((x) => x.id === id);
    if (p) return { category: c, product: p };
  }
  return null;
};
const baseEdition = (id: string) => baseCategories().find((c) => c.id === id) ?? null;

const isColor = (v: string) => /^#[0-9a-f]{6}$/i.test(v);
const isUrl = (v: string) => /^(https:\/\/|\/)/.test(v);

function finish(paths: string[]) {
  updateTag(SITE_DATA_TAG);
  for (const p of paths) revalidatePath(p);
}

/* ═════════════════════════ Cafés ═════════════════════════ */

/** Crea un café (sin id) o guarda uno existente */
export async function saveProduct(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return NOT_READY;
  await ensureSiteData(); // presentaciones actuales (SIZES)

  const names = textsFrom(form, "name", 120);
  if (!names.es) return { error: "El nombre en español es obligatorio." };

  const prices: Record<string, number> = {};
  const stock: Record<string, number | null> = {};
  for (const s of SIZES) {
    const rawPrice = str(form, `price_${s}`).replace(",", ".");
    /* 250 g es obligatoria; en las demás, sin precio = no se vende */
    if (rawPrice === "" && s !== DEFAULT_SIZE) continue;
    const p = Number(rawPrice);
    if (!(p > 0) || p > 100000) return { error: `Revisa el precio de ${s}.` };
    prices[s] = Math.round(p * 100) / 100;
    const raw = str(form, `stock_${s}`);
    if (raw === "") stock[s] = null;
    else {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) return { error: `El stock de ${s} debe ser un número entero (0 o más).` };
      stock[s] = n;
    }
  }

  /* Fotos: ruta de public (/images/…) o enlace https (Drive → enlace directo) */
  const image = driveDirect(str(form, "image", 600));
  const hoverImage = driveDirect(str(form, "hover_image", 600));
  if ((image && !isUrl(image)) || (hoverImage && !isUrl(hoverImage)))
    return { error: "Las fotos deben ser un enlace https:// o una ruta /images/…" };
  const cardBg = str(form, "card_bg", 7);
  if (cardBg && !isColor(cardBg)) return { error: "Revisa el color de la tarjeta." };
  const sortRaw = str(form, "sort", 6);
  const sort = sortRaw === "" ? null : Number(sortRaw);
  if (sort !== null && !Number.isInteger(sort)) return { error: "El orden debe ser un número entero." };
  const certifications = form
    .getAll("certifications")
    .map(String)
    .filter((c): c is CertificationId => c in CERTIFICATIONS);

  let id = str(form, "id", 60);
  const isNew = !id;
  const base = id ? findBase(id) : null;

  try {
    /* Lo que hay en la base, todo a la vez */
    const [rows, editionRows, varietalRows, processRows] = await Promise.all([
      db.select<ProductRow>("products", { select: "id,category_id,custom,image,hover_image" }),
      db.select<EditionRow>("editions", { select: "id,deleted" }),
      db.select<{ id: string }>("varietals", { select: "id", order: "sort.asc.nullslast,created_at.asc" }),
      db.select<{ id: string }>("processes", { select: "id", order: "sort.asc.nullslast,created_at.asc" }),
    ]);
    const existing = rows.find((r) => r.id === id);
    if (!isNew && !base && !existing) return { error: "Café no encontrado." };

    /* Edición: cualquier café (también los del código) se puede mover */
    const oldCategory = existing?.category_id ?? base?.category.id;
    const categoryId = str(form, "edition", 60) || oldCategory || "";
    const editionOk =
      (baseEdition(categoryId) && !editionRows.some((e) => e.id === categoryId && e.deleted)) ||
      editionRows.some((e) => e.id === categoryId && !e.deleted);
    if (!editionOk) return { error: "Elige una edición." };

    if (isNew) {
      const taken = new Set([
        ...baseCategories().flatMap((c) => c.products.map((p) => p.id)),
        ...rows.map((r) => r.id),
      ]);
      id = uniqueId(names.es, taken);
    }

    const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    const moved = Boolean(oldCategory && oldCategory !== categoryId);

    /* Todo se guarda a la vez (antes, uno tras otro) */
    await Promise.all([
      db.upsert<ProductRow>("products", {
        id,
        category_id: categoryId,
        custom: !base,
        active: form.get("active") === "on",
        deleted: false,
        prices,
        stock,
        sold_out: form.get("sold_out") === "on",
        sold_out_sizes: SIZES.filter((sz) => form.get(`sold_out_${sz}`) === "on"),
        image: base && image === (base.product.image ?? "") ? null : image || null,
        hover_image: base && hoverImage === (base.product.hoverImage ?? "") ? null : hoverImage || null,
        card_bg: base && cardBg === (base.product.cardBg ?? "") ? null : cardBg || null,
        certifications: base && same(certifications, base.product.certifications) ? null : certifications,
        sort,
        updated_at: new Date().toISOString(),
      } as Partial<ProductRow> & { updated_at: string }),
      /* Varietales y procesos que tiene (y si el cliente los ve) */
      ...(
        [
          ["varietals", "product_varietals", "varietal_id", varietalRows],
          ["processes", "product_processes", "process_id", processRows],
        ] as const
      ).map(async ([kind, table, col, all]) => {
        const chosen = all.filter((o) => form.get(`${kind}_on_${o.id}`) === "on");
        await db.remove(table, { product_id: `eq.${id}` });
        if (chosen.length)
          await db.insert(
            table,
            chosen.map((o, i) => ({
              product_id: id,
              [col]: o.id,
              active: form.get(`${kind}_visible_${o.id}`) === "on",
              sold_out: form.get(`${kind}_soldout_${o.id}`) === "on",
              sort: i * 10,
            })),
          );
      }),
      /* Si cambió de edición, su nombre se mueve con él */
      moved ? db.remove("i18n_overrides", { key: `eq.editions.${oldCategory}.products.${id}` }) : null,
      saveTexts(`editions.${categoryId}.products.${id}`, names),
      logAudit(isNew ? "Creó un café" : moved ? "Editó y movió un café" : "Editó un café", "producto", id, {
        nombre: names.es,
        edicion: categoryId,
        ...(moved && { antes: oldCategory }),
        precios: prices,
        stock,
        activo: form.get("active") === "on",
        ...(form.get("sold_out") === "on" && { agotado: true }),
      }),
    ]);
    /* Fotos de Drive que se cambiaron: se borran si nadie más las usa */
    dropDriveFiles([existing?.image, existing?.hover_image].filter((u) => u && u !== image && u !== hoverImage));
    finish(["/admin/productos", `/admin/productos/${id}`]);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
  if (isNew) redirect(`/admin/productos/${id}`);
  return { ok: "Café guardado. La web ya muestra los cambios." };
}

/**
 * Mueve un café a otra edición (desplegable de la lista). Su nombre en los
 * 8 idiomas se lleva a la clave de la nueva edición; precios, stock, fotos,
 * varietales y procesos no cambian.
 */
export async function moveProduct(id: string, categoryId: string): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return NOT_READY;
  try {
    const [existing, edition] = await Promise.all([
      db.one<ProductRow>("products", { id: `eq.${id}` }),
      db.one<EditionRow>("editions", { id: `eq.${categoryId}` }),
    ]);
    const base = findBase(id);
    if (!existing && !base) return { error: "Café no encontrado." };
    if (edition ? edition.deleted : !baseEdition(categoryId)) return { error: "Esa edición no existe." };
    const from = existing?.category_id ?? base!.category.id;
    if (from === categoryId) return { ok: "Ya está en esa edición." };

    const codeKey = base ? `editions.${base.category.id}.products.${id}` : undefined;
    const names = Object.fromEntries(
      Object.entries(await textsFor(`editions.${from}.products.${id}`, codeKey)).map(([l, t]) => [l, t.value]),
    );
    await Promise.all([
      db.upsert("products", { id, category_id: categoryId, custom: !base, updated_at: new Date().toISOString() }),
      saveTexts(`editions.${categoryId}.products.${id}`, names),
      db.remove("i18n_overrides", { key: `eq.editions.${from}.products.${id}` }),
      logAudit("Movió un café de edición", "producto", id, { nombre: names.es, antes: from, edicion: categoryId }),
    ]);
    finish(["/admin/productos", `/admin/productos/${id}`]);
    return { ok: "Café movido. La web ya lo muestra en su nueva edición." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo mover." };
  }
}

/** Mostrar u ocultar un café en la web (desde la lista) */
export async function toggleProduct(id: string, active: boolean) {
  await requireAdmin();
  if (!dbReady()) return;
  const base = findBase(id);
  const existing = await db.one<ProductRow>("products", { id: `eq.${id}` });
  if (existing) await db.update("products", { id: `eq.${id}` }, { active, updated_at: new Date().toISOString() });
  else if (base) await db.insert("products", { id, category_id: base.category.id, active });
  else return;
  await logAudit(active ? "Mostró un café" : "Ocultó un café", "producto", id);
  finish(["/admin/productos"]);
}

/** Elimina un café: los del código quedan como eliminados (se pueden restaurar) */
export async function deleteProduct(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return NOT_READY;
  const base = findBase(id);
  const existing = await db.one<ProductRow>("products", { id: `eq.${id}` });
  if (base) {
    if (existing) await db.update("products", { id: `eq.${id}` }, { deleted: true, updated_at: new Date().toISOString() });
    else await db.insert("products", { id, category_id: base.category.id, active: true, deleted: true });
  } else if (existing) {
    dropDriveFiles([existing.image, existing.hover_image]);
    await Promise.all([
      db.remove("products", { id: `eq.${id}` }),
      db.remove("i18n_overrides", { key: `eq.editions.${existing.category_id}.products.${id}` }),
    ]);
  } else return { error: "Café no encontrado." };
  await logAudit("Eliminó un café", "producto", id);
  finish(["/admin/productos"]);
  redirect("/admin/productos");
}

/** Devuelve a la web un café del código que se había eliminado */
export async function restoreProduct(id: string) {
  await requireAdmin();
  if (!dbReady()) return;
  await db.update("products", { id: `eq.${id}` }, { deleted: false, updated_at: new Date().toISOString() });
  await logAudit("Restauró un café eliminado", "producto", id);
  finish(["/admin/productos"]);
}

/** Vuelve a los precios, stock, fotos y nombres del código */
export async function resetProduct(id: string) {
  await requireAdmin();
  if (!dbReady()) return;
  const base = findBase(id);
  if (!base) return;
  const existing = await db.one<ProductRow>("products", { id: `eq.${id}` });
  /* Vuelve también a su edición: se borran sus nombres en la otra */
  const keys = new Set([base.category.id, existing?.category_id].filter(Boolean));
  dropDriveFiles([existing?.image, existing?.hover_image]);
  await Promise.all([
    db.remove("products", { id: `eq.${id}` }),
    ...[...keys].map((c) => db.remove("i18n_overrides", { key: `eq.editions.${c}.products.${id}` })),
    logAudit("Volvió un café a los datos del código", "producto", id),
  ]);
  finish(["/admin/productos", `/admin/productos/${id}`]);
}

/* ═════════════════════════ Ediciones ═════════════════════════ */

/** Crea una edición (sin id) o guarda una existente */
export async function saveEdition(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return NOT_READY;

  const names = textsFrom(form, "name", 80);
  const bigBot = textsFrom(form, "bigBot", 24);
  const subtitle = textsFrom(form, "subtitle", 600);
  if (!names.es) return { error: "El nombre en español es obligatorio." };
  if (!bigBot.es) return { error: "La palabra grande del slider en español es obligatoria." };

  const colors: Record<string, string> = {};
  for (const k of ["color", "panel_bg", "hero_text_color", "heading_color"]) {
    const v = str(form, k, 7);
    if (!isColor(v)) return { error: "Revisa los colores." };
    colors[k] = v.toUpperCase();
  }
  const panelImage = driveDirect(str(form, "panel_image", 600));
  if (panelImage && !isUrl(panelImage)) return { error: "La imagen debe ser un enlace https:// o una ruta /images/…" };
  const sortRaw = str(form, "sort", 6);
  const sort = sortRaw === "" ? null : Number(sortRaw);
  if (sort !== null && !Number.isInteger(sort)) return { error: "El orden debe ser un número entero." };

  let id = str(form, "id", 60);
  const isNew = !id;
  const base = id ? baseEdition(id) : null;

  try {
    const rows = await db.select<EditionRow>("editions", { select: "id,panel_image" });
    if (!isNew && !base && !rows.some((r) => r.id === id)) return { error: "Edición no encontrada." };
    const before = rows.find((r) => r.id === id)?.panel_image;
    if (isNew) {
      const taken = new Set([...baseCategories().map((c) => c.id), ...rows.map((r) => r.id)]);
      id = uniqueId(names.es, taken);
    }
    const differs = (v: string, code?: string) => (base && v === (code ?? "").toUpperCase() ? null : v);
    const row = db.upsert("editions", {
      id,
      custom: !base,
      active: form.get("active") === "on",
      deleted: false,
      color: differs(colors.color, base?.color),
      panel_bg: differs(colors.panel_bg, base?.panelBg),
      hero_text_color: differs(colors.hero_text_color, base?.heroTextColor),
      heading_color: differs(colors.heading_color, base?.headingColor),
      panel_image: base && panelImage === (base.panelImage ?? "") ? null : panelImage || null,
      sort,
      updated_at: new Date().toISOString(),
    });
    await Promise.all([
      row,
      saveTexts(`editions.${id}.name`, names),
      saveTexts(`editions.${id}.bigBot`, Object.fromEntries(Object.entries(bigBot).map(([l, v]) => [l, v.toUpperCase()]))),
      saveTexts(`editions.${id}.subtitle`, subtitle),
    ]);

    await logAudit(isNew ? "Creó una edición" : "Editó una edición", "edicion", id, { nombre: names.es, activa: form.get("active") === "on" });
    if (before !== panelImage) dropDriveFiles([before]);
    finish(["/admin/productos", `/admin/productos/ediciones/${id}`]);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
  if (isNew) redirect(`/admin/productos/ediciones/${id}`);
  return { ok: "Edición guardada. La web ya muestra los cambios." };
}

/** Mostrar u ocultar una edición entera */
export async function toggleEdition(id: string, active: boolean) {
  await requireAdmin();
  if (!dbReady()) return;
  const existing = await db.one<EditionRow>("editions", { id: `eq.${id}` });
  if (existing) await db.update("editions", { id: `eq.${id}` }, { active, updated_at: new Date().toISOString() });
  else if (baseEdition(id)) await db.insert("editions", { id, active });
  else return;
  await logAudit(active ? "Mostró una edición" : "Ocultó una edición", "edicion", id);
  finish(["/admin/productos"]);
}

/** Elimina una edición. Una creada en el panel debe quedar sin cafés antes */
export async function deleteEdition(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return NOT_READY;
  const base = baseEdition(id);
  if (base) {
    await db.upsert("editions", { id, deleted: true, updated_at: new Date().toISOString() });
  } else {
    const inside = await db.select<ProductRow>("products", { category_id: `eq.${id}`, deleted: "eq.false", select: "id" });
    if (inside.length) return { error: "Primero mueve o elimina los cafés de esta edición." };
    const [gone, edition] = await Promise.all([
      db.select<ProductRow>("products", { category_id: `eq.${id}`, select: "image,hover_image" }),
      db.one<EditionRow>("editions", { id: `eq.${id}` }),
    ]);
    dropDriveFiles([edition?.panel_image, ...gone.flatMap((p) => [p.image, p.hover_image])]);
    await Promise.all([
      db.remove("products", { category_id: `eq.${id}` }),
      db.remove("editions", { id: `eq.${id}` }),
      db.remove("i18n_overrides", { key: `like.editions.${id}.*` }),
    ]);
  }
  await logAudit("Eliminó una edición", "edicion", id);
  finish(["/admin/productos"]);
  redirect("/admin/productos");
}

/** Devuelve una edición del código que se había eliminado */
export async function restoreEdition(id: string) {
  await requireAdmin();
  if (!dbReady()) return;
  await db.update("editions", { id: `eq.${id}` }, { deleted: false, updated_at: new Date().toISOString() });
  await logAudit("Restauró una edición eliminada", "edicion", id);
  finish(["/admin/productos"]);
}

/* ═════════════════════════ Presentaciones ═════════════════════════ */

async function savedSizes() {
  const row = await db.one<{ value: SizeSetting[] }>("settings", { key: "eq.sizes" });
  return Array.isArray(row?.value) ? row.value : [];
}

async function storeSizes(list: SizeSetting[]) {
  await db.upsert("settings", { key: "sizes", value: list, updated_at: new Date().toISOString() });
}

/** Crea una presentación (sin id) o cambia su nombre y orden */
export async function saveSize(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return NOT_READY;
  await ensureSiteData(); // presentaciones actuales (SIZES)
  const labels = textsFrom(form, "label", 40);
  if (!labels.es) return { error: "El nombre en español es obligatorio (p. ej. 500 g)." };
  const sortRaw = str(form, "sort", 6);
  const sort = sortRaw === "" ? null : Number(sortRaw);
  if (sort !== null && !Number.isInteger(sort)) return { error: "El orden debe ser un número entero." };

  let id = str(form, "id", 40);
  const isNew = !id;
  const isCode = (CODE_SIZES as readonly string[]).includes(id);
  try {
    const list = await savedSizes();
    if (!isNew && !isCode && !list.some((x) => x.id === id)) return { error: "Presentación no encontrada." };
    if (isNew) {
      const taken = new Set<string>([...CODE_SIZES, ...list.map((x) => x.id)]);
      if (taken.has(slugify(labels.es.replace(/\s+/g, ""))))
        return { error: `Ya existe la presentación "${labels.es}".` };
      id = uniqueId(labels.es.replace(/\s+/g, ""), taken);
      list.push({ id, sort });
    } else if (!isCode) {
      for (const x of list) if (x.id === id) x.sort = sort;
    }
    if (!isCode) await storeSizes(list);
    await saveTexts(`shop.sizes.${id}`, labels);
    await logAudit(isNew ? "Creó una presentación" : "Editó una presentación", "presentacion", id, { nombre: labels.es });
    finish(["/admin/productos", "/admin/productos/presentaciones"]);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
  return { ok: isNew ? "Presentación creada. Ponle precio en cada café que se venda así." : "Presentación guardada." };
}

/** Elimina una presentación creada en el panel (las del código se quedan) */
export async function deleteSize(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return NOT_READY;
  if ((CODE_SIZES as readonly string[]).includes(id)) return { error: "Las presentaciones de 250 g y 1 kg no se pueden eliminar." };
  await storeSizes((await savedSizes()).filter((x) => x.id !== id));
  await db.remove("i18n_overrides", { key: `eq.shop.sizes.${id}` });
  await logAudit("Eliminó una presentación", "presentacion", id);
  finish(["/admin/productos", "/admin/productos/presentaciones"]);
  return { ok: "Presentación eliminada." };
}
