"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/src/lib/admin/auth";
import { db, dbReady, SITE_DATA_TAG } from "@/src/lib/db/supabase";
import { logAudit } from "@/src/lib/admin/audit";
import { saveTexts, textsFrom, uniqueId } from "@/src/lib/admin/catalog";
import { baseCombos } from "@/src/lib/site-data/apply";
import { ensureSiteData } from "@/src/lib/site-data/load";
import type { ComboRow } from "@/src/lib/site-data/rows";
import { CATEGORIES, COMBO_SIZE } from "@/src/components/product-showcase/data";
import { SIZES } from "@/src/lib/shop";
import type { ActionState } from "./orders";

/* ───────────────────────────────────────────────────────────────
   Combos desde el panel. Los del código se editan, pausan o quedan como
   "eliminados" (se pueden restaurar); los creados aquí se borran de verdad.
   El nombre va en i18n_overrides (cart.combos.<id>.name).
─────────────────────────────────────────────────────────────── */

const NOT_READY = { error: "Conecta Supabase para guardar cambios." };
const isBase = (id: string) => baseCombos().some((c) => c.id === id);

function finish(id?: string) {
  updateTag(SITE_DATA_TAG);
  revalidatePath("/admin/combos");
  if (id) revalidatePath(`/admin/combos/${id}`);
}

/** Crea un combo (sin id) o guarda uno existente */
export async function saveCombo(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return NOT_READY;
  await ensureSiteData(); // catálogo actual para validar los cafés

  const names = textsFrom(form, "name", 80);
  if (!names.es) return { error: "El nombre en español es obligatorio." };

  const discount = Number(String(form.get("discount") ?? "").replace(",", "."));
  if (!(discount > 0) || discount >= 100) return { error: "El descuento debe ser un % entre 1 y 99." };

  /* Cafés: "edición/café/presentación", sin repetir y que existan */
  const items = [...new Set(form.getAll("items").map(String))].map((v) => {
    const [categoryId, productId, size = COMBO_SIZE] = v.split("/");
    return { categoryId, productId, size };
  });
  if (items.length < 2) return { error: "Elige al menos 2 cafés." };
  for (const i of items) {
    const p = CATEGORIES.find((c) => c.id === i.categoryId)?.products.find((x) => x.id === i.productId);
    if (!p) return { error: "Uno de los cafés ya no está a la venta; quítalo del combo." };
    if (!SIZES.includes(i.size) || !(Number(p.prices[i.size]) > 0))
      return { error: `Un café del combo no se vende en la presentación elegida (${i.size}).` };
  }

  const sortRaw = String(form.get("sort") ?? "").trim();
  const sort = sortRaw === "" ? null : Number(sortRaw);
  if (sort !== null && !Number.isInteger(sort)) return { error: "El orden debe ser un número entero." };

  let id = String(form.get("id") ?? "").trim();
  const isNew = !id;
  try {
    const rows = await db.select<ComboRow>("combos", { select: "id" });
    if (!isNew && !isBase(id) && !rows.some((r) => r.id === id)) return { error: "Combo no encontrado." };
    if (isNew) id = uniqueId(names.es, new Set([...baseCombos().map((c) => c.id), ...rows.map((r) => r.id)]));

    await Promise.all([
      db.upsert("combos", {
        id,
        custom: !isBase(id),
        active: form.get("active") === "on",
        deleted: false,
        discount,
        items,
        sort,
        updated_at: new Date().toISOString(),
      }),
      saveTexts(`cart.combos.${id}.name`, names),
    ]);
    await logAudit(isNew ? "Creó un combo" : "Editó un combo", "combo", id, {
      nombre: names.es,
      descuento: discount,
      cafes: items.map((i) => i.productId),
    });
    finish(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
  if (isNew) redirect(`/admin/combos/${id}`);
  return { ok: "Combo guardado. Ya se ofrece en el carrito." };
}

/** Pausar o reactivar (desde la lista) */
export async function toggleCombo(id: string, active: boolean) {
  await requireAdmin();
  if (!dbReady()) return;
  const existing = await db.one<ComboRow>("combos", { id: `eq.${id}` });
  if (existing) await db.update("combos", { id: `eq.${id}` }, { active, updated_at: new Date().toISOString() });
  else if (isBase(id)) await db.insert("combos", { id, active });
  else return;
  await logAudit(active ? "Reactivó un combo" : "Pausó un combo", "combo", id);
  finish();
}

/** Elimina un combo: los del código quedan como eliminados (se pueden restaurar) */
export async function deleteCombo(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return NOT_READY;
  if (isBase(id)) {
    await db.upsert("combos", { id, deleted: true, updated_at: new Date().toISOString() });
  } else {
    await Promise.all([
      db.remove("combos", { id: `eq.${id}` }),
      db.remove("i18n_overrides", { key: `eq.cart.combos.${id}.name` }),
    ]);
  }
  await logAudit("Eliminó un combo", "combo", id);
  finish();
  redirect("/admin/combos");
}

/** Devuelve un combo del código que se había eliminado */
export async function restoreCombo(id: string) {
  await requireAdmin();
  if (!dbReady()) return;
  await db.update("combos", { id: `eq.${id}` }, { deleted: false, updated_at: new Date().toISOString() });
  await logAudit("Restauró un combo eliminado", "combo", id);
  finish();
}
