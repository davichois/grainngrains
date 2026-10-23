"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/src/lib/admin/auth";
import { db, dbReady } from "@/src/lib/db/supabase";
import { logAudit } from "@/src/lib/admin/audit";
import type { ActionState } from "./orders";

const STATUSES = ["new", "replied", "closed"];

export async function updateMessage(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return { error: "Conecta Supabase para guardar cambios." };
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !STATUSES.includes(status))
    return { error: "Datos no válidos." };
  try {
    await db.update("messages", { id: `eq.${id}` }, {
      status,
      notes: String(form.get("notes") ?? "").trim().slice(0, 2000) || null,
    });
    await logAudit("Actualizó un mensaje", "mensaje", id, { estado: status });
    revalidatePath(`/admin/mensajes/${id}`);
    revalidatePath("/admin/mensajes");
    return { ok: "Mensaje actualizado." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
}

/** Marca como respondido al abrir el correo o WhatsApp para contestar */
export async function markReplied(id: string) {
  await requireAdmin();
  if (!dbReady() || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await db.update("messages", { id: `eq.${id}`, status: "eq.new" }, { status: "replied" });
  revalidatePath("/admin/mensajes");
}
