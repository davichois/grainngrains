"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/src/lib/admin/auth";
import { db, dbReady } from "@/src/lib/db/supabase";
import { logAudit } from "@/src/lib/admin/audit";
import { routing } from "@/src/i18n/routing";
import { canTranslate, translateTexts, type TranslateField } from "@/src/lib/admin/translate";
import type { ActionState } from "./orders";

export type TranslateResult = { texts?: Record<string, Record<string, string>>; error?: string };

/** Traduce con Claude los textos en español de un formulario */
export async function translateForm(fields: TranslateField[]): Promise<TranslateResult> {
  await requireAdmin();
  if (!canTranslate()) return { error: "Falta ANTHROPIC_API_KEY en el .env para traducir con Claude." };
  const clean = fields
    .map((f) => ({ key: String(f.key).slice(0, 40), hint: String(f.hint).slice(0, 200), text: String(f.text).trim().slice(0, 1000) }))
    .filter((f) => f.text);
  if (!clean.length) return { error: "Escribe primero el texto en español." };
  try {
    const texts = await translateTexts(clean, routing.locales.filter((l) => l !== "es"));
    return { texts };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { error: "La clave de Claude (ANTHROPIC_API_KEY) no es válida." };
    if (e instanceof Anthropic.RateLimitError) return { error: "Claude está ocupado. Intenta en un momento." };
    if (e instanceof Anthropic.APIConnectionError) return { error: "No se pudo conectar con Claude." };
    if (e instanceof Anthropic.APIError) return { error: `Claude respondió con un error (${e.status}).` };
    return { error: e instanceof Error ? e.message : "No se pudo traducir." };
  }
}

/** Ajustes → Traducción: manual (inputs por idioma) o automática con Claude */
export async function saveTranslationMode(_p: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return { error: "Conecta Supabase para guardar cambios." };
  const manual = f.get("manual") === "on";
  await db.upsert("settings", { key: "translation", value: { manual }, updated_at: new Date().toISOString() });
  await logAudit("Cambió ajustes: traducción", "ajustes", "translation", { manual });
  revalidatePath("/admin", "layout");
  return { ok: manual ? "Traducción manual: verás los campos de cada idioma." : "Traducción con Claude: verás el botón «Traducir automáticamente»." };
}
