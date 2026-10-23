"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/src/lib/admin/auth";
import { db, dbReady, SITE_DATA_TAG } from "@/src/lib/db/supabase";
import { logAudit } from "@/src/lib/admin/audit";
import type { ShopSettings } from "@/src/lib/shop";
import type { ContactSettings, PromoSettings } from "@/src/lib/site";
import type { ActionState } from "./orders";

const str = (f: FormData, k: string, max = 120) => String(f.get(k) ?? "").trim().slice(0, max);
const n = (f: FormData, k: string, label: string, { int = false, min = 0 } = {}) => {
  const v = Number(str(f, k).replace(",", "."));
  if (!Number.isFinite(v) || v < min || (int && !Number.isInteger(v)))
    throw new Error(`Revisa "${label}".`);
  return v;
};

async function save(key: string, value: unknown, label: string) {
  await db.upsert("settings", { key, value, updated_at: new Date().toISOString() });
  await logAudit(`Cambió ajustes: ${label}`, "ajustes", key, value as Record<string, unknown>);
  updateTag(SITE_DATA_TAG);
  revalidatePath("/admin/ajustes");
}

export async function saveContact(_p: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return { error: "Conecta Supabase para guardar cambios." };
  const value: ContactSettings = {
    phone: str(f, "phone", 30),
    whatsapp: str(f, "whatsapp", 20).replace(/\D/g, ""),
    email: str(f, "email"),
  };
  if (value.phone.replace(/\D/g, "").length < 9) return { error: "Revisa el teléfono." };
  if (value.whatsapp.length < 9) return { error: "El WhatsApp va con código de país, p. ej. 51927645665." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) return { error: "Revisa el correo." };
  await save("contact", value, "contacto");
  return { ok: "Contacto guardado. Ya se ve en la web." };
}

export async function saveShipping(_p: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return { error: "Conecta Supabase para guardar cambios." };
  try {
    const value: ShopSettings = {
      freeShippingFrom: n(f, "freeFrom", "envío gratis desde"),
      rates: { lima: n(f, "limaRate", "tarifa Lima"), provinces: n(f, "provRate", "tarifa provincias") },
      days: {
        lima: { min: n(f, "limaMin", "días Lima", { int: true, min: 1 }), max: n(f, "limaMax", "días Lima", { int: true, min: 1 }) },
        provinces: { min: n(f, "provMin", "días provincias", { int: true, min: 1 }), max: n(f, "provMax", "días provincias", { int: true, min: 1 }) },
      },
    };
    if (value.days.lima.min > value.days.lima.max || value.days.provinces.min > value.days.provinces.max)
      return { error: "El mínimo de días no puede ser mayor que el máximo." };
    await save("shop", value, "envíos");
    return { ok: "Envíos guardados. El checkout ya usa estos valores." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Revisa los datos." };
  }
}

export async function savePromo(_p: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return { error: "Conecta Supabase para guardar cambios." };
  const value: PromoSettings = {
    code: str(f, "code", 40).toUpperCase(),
    enabled: f.get("enabled") === "on",
  };
  if (!/^[A-Z0-9_-]{3,40}$/.test(value.code)) return { error: "Escribe un código de cupón válido." };
  await save("promo", value, "promoción");
  return { ok: "Promoción guardada." };
}
