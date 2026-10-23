import "server-only";
import { db } from "@/src/lib/db/supabase";
import { baseText, LOCALES } from "./texts";

/* Piezas comunes del catálogo en el panel (cafés, ediciones, combos):
   ids a partir del nombre y textos por idioma en i18n_overrides */

/** Rutas del panel que no pueden ser ids */
const RESERVED = new Set(["nuevo", "nueva", "ediciones", "presentaciones", "opciones"]);

/** "Café de Altura" → "cafe-de-altura" */
export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "item";

/** Id libre a partir del nombre (sin repetir uno del código ni de la base) */
export function uniqueId(name: string, taken: Set<string>) {
  const slug = slugify(name);
  let id = slug;
  for (let i = 2; taken.has(id) || RESERVED.has(id); i++) id = `${slug}-${i}`;
  return id;
}

/** Guarda un texto en cada idioma (vacío = el español). Si coincide con el
 *  texto original del código, se borra el cambio. */
export async function saveTexts(key: string, values: Record<string, string>) {
  const now = new Date().toISOString();
  /* Los 8 idiomas a la vez (antes uno tras otro) */
  const base = await Promise.all(LOCALES.map((l) => baseText(l, key)));
  const keep: { locale: string; key: string; value: string; updated_at: string }[] = [];
  const drop: string[] = [];
  LOCALES.forEach((l, i) => {
    const value = values[l] || values.es;
    if (value === base[i]) drop.push(l);
    else keep.push({ locale: l, key, value, updated_at: now });
  });
  await Promise.all([
    keep.length ? db.upsert("i18n_overrides", keep, "locale,key") : null,
    drop.length ? db.remove("i18n_overrides", { key: `eq.${key}`, locale: `in.(${drop.join(",")})` }) : null,
  ]);
}

export const textsFrom = (f: FormData, field: string, max: number) =>
  Object.fromEntries(LOCALES.map((l) => [l, String(f.get(`${field}_${l}`) ?? "").trim().slice(0, max)]));

