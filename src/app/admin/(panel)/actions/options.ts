"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/src/lib/admin/auth";
import { db, dbReady, SITE_DATA_TAG } from "@/src/lib/db/supabase";
import { logAudit } from "@/src/lib/admin/audit";
import { saveTexts, slugify, textsFrom, uniqueId } from "@/src/lib/admin/catalog";
import type { OptionRow } from "@/src/lib/site-data/rows";
import type { ActionState } from "./orders";

/* ───────────────────────────────────────────────────────────────
   Varietales y procesos (pestaña propia del panel). Cada lista vive en su
   tabla (varietals / processes) y lo que tiene cada café en
   product_varietals / product_processes, con "visible al cliente".
   Los nombres van en i18n_overrides (shop.varietals.<id> / shop.processes.<id>).
─────────────────────────────────────────────────────────────── */

type Kind = "varietals" | "processes";
const KINDS: Kind[] = ["varietals", "processes"];
const LINK_TABLE = { varietals: "product_varietals", processes: "product_processes" } as const;
const LINK_COL = { varietals: "varietal_id", processes: "process_id" } as const;
const ONE: Record<Kind, string> = { varietals: "la varietal", processes: "el proceso" };
const NOT_READY = { error: "Conecta Supabase para guardar cambios." };

function finish(kind?: Kind, id?: string) {
  updateTag(SITE_DATA_TAG);
  revalidatePath("/admin/opciones");
  revalidatePath("/admin/productos");
  if (kind && id) revalidatePath(`/admin/opciones/${kind}/${id}`);
}

/** Crea (sin id) o guarda una varietal o un proceso */
export async function saveCoffeeOption(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return NOT_READY;
  const kind = String(form.get("kind")) as Kind;
  if (!KINDS.includes(kind)) return { error: "Tipo no válido." };
  const names = textsFrom(form, "name", 60);
  if (!names.es) return { error: "El nombre en español es obligatorio." };
  const sortRaw = String(form.get("sort") ?? "").trim();
  const sort = sortRaw === "" ? null : Number(sortRaw);
  if (sort !== null && !Number.isInteger(sort)) return { error: "El orden debe ser un número entero." };

  let id = String(form.get("id") ?? "").trim();
  const isNew = !id;
  try {
    const rows = await db.select<OptionRow>(kind, { select: "id" });
    if (isNew) {
      if (rows.some((r) => r.id === slugify(names.es))) return { error: `Ya existe ${ONE[kind]} "${names.es}".` };
      id = uniqueId(names.es, new Set(rows.map((r) => r.id)));
    } else if (!rows.some((r) => r.id === id)) return { error: "No encontrado." };

    await Promise.all([
      db.upsert(kind, { id, active: form.get("active") === "on", sort, updated_at: new Date().toISOString() }),
      saveTexts(`shop.${kind}.${id}`, names),
    ]);
    await logAudit(`${isNew ? "Creó" : "Editó"} ${ONE[kind]}`, kind === "varietals" ? "varietal" : "proceso", id, { nombre: names.es });
    finish(kind, id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
  if (isNew) redirect(`/admin/opciones/${kind}/${id}`);
  return { ok: "Guardado. La web ya muestra los cambios." };
}

/** Activar o desactivar en la lista (inactiva = no se ofrece en ningún café) */
export async function toggleCoffeeOption(kind: Kind, id: string, active: boolean) {
  await requireAdmin();
  if (!dbReady() || !KINDS.includes(kind)) return;
  await db.update(kind, { id: `eq.${id}` }, { active, updated_at: new Date().toISOString() });
  await logAudit(`${active ? "Activó" : "Desactivó"} ${ONE[kind]}`, kind === "varietals" ? "varietal" : "proceso", id);
  finish(kind, id);
}

/** Mostrar u ocultar al cliente una varietal o un proceso de un café */
export async function toggleProductOption(kind: Kind, productId: string, optionId: string, active: boolean) {
  await requireAdmin();
  if (!dbReady() || !KINDS.includes(kind)) return;
  await db.update(LINK_TABLE[kind], { product_id: `eq.${productId}`, [LINK_COL[kind]]: `eq.${optionId}` }, { active });
  await logAudit(`${active ? "Mostró" : "Ocultó"} ${ONE[kind]} de un café`, "producto", productId, { opcion: optionId });
  finish(kind, optionId);
  revalidatePath(`/admin/productos/${productId}`);
}

/** Elimina una varietal o un proceso (y lo quita de todos los cafés) */
export async function deleteCoffeeOption(kind: Kind, id: string): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return NOT_READY;
  if (!KINDS.includes(kind)) return { error: "Tipo no válido." };
  /* Primero los cafés que la usan (clave foránea), lo demás a la vez */
  await db.remove(LINK_TABLE[kind], { [LINK_COL[kind]]: `eq.${id}` });
  await Promise.all([
    db.remove(kind, { id: `eq.${id}` }),
    db.remove("i18n_overrides", { key: `eq.shop.${kind}.${id}` }),
  ]);
  await logAudit(`Eliminó ${ONE[kind]}`, kind === "varietals" ? "varietal" : "proceso", id);
  finish();
  redirect(`/admin/opciones${kind === "processes" ? "?tipo=procesos" : ""}`);
}
