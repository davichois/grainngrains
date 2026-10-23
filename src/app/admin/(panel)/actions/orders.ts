"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/src/lib/admin/auth";
import { db, dbReady } from "@/src/lib/db/supabase";
import { logAudit } from "@/src/lib/admin/audit";
import { sendShippedEmail } from "@/src/lib/admin/notify";
import type { OrderRow, OrderStatus } from "@/src/lib/admin/orders-store";

export type ActionState = { ok?: string; error?: string } | undefined;

const STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "rejected",
];

const text = (v: FormDataEntryValue | null, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

async function load(number: string) {
  if (!dbReady()) throw new Error("Conecta Supabase para guardar cambios.");
  const order = await db.one<OrderRow>("orders", { number: `eq.${number}` });
  if (!order) throw new Error("No se encontró el pedido.");
  return order;
}

/** Cambia el estado; al marcar "Enviado" puede avisar al cliente por correo */
export async function updateOrderStatus(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();
  try {
    const number = text(form.get("number"), 40);
    const status = text(form.get("status"), 20) as OrderStatus;
    if (!STATUSES.includes(status)) return { error: "Estado no válido." };
    const order = await load(number);
    const carrier = text(form.get("carrier"), 80) || null;
    const tracking = text(form.get("tracking"), 120) || null;
    const note = text(form.get("note"), 300);
    const notify = form.get("notify") === "on";
    const now = new Date().toISOString();
    const changed = status !== order.status;

    const updated = await db.update<OrderRow>("orders", { number: `eq.${number}` }, {
      status,
      carrier,
      tracking_code: tracking,
      updated_at: now,
      ...((changed || note) && {
        history: [
          ...order.history,
          { at: now, status, by: session.u, ...(note && { note }) },
        ],
      }),
    });
    await logAudit("Cambió el estado del pedido", "pedido", number, {
      de: order.status,
      a: status,
      ...(note && { nota: note }),
    });

    let mailNote = "";
    if (status === "shipped" && notify && updated[0]) {
      const sent = await sendShippedEmail(updated[0]).catch(() => false);
      mailNote = sent
        ? " Se avisó al cliente por correo."
        : " No se pudo enviar el correo (revisa Resend).";
    }
    revalidatePath(`/admin/pedidos/${number}`);
    revalidatePath("/admin/pedidos");
    return { ok: `Pedido actualizado.${mailNote}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
}

export async function saveOrderNotes(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    const number = text(form.get("number"), 40);
    await load(number);
    await db.update("orders", { number: `eq.${number}` }, {
      notes: text(form.get("notes"), 2000) || null,
      updated_at: new Date().toISOString(),
    });
    revalidatePath(`/admin/pedidos/${number}`);
    return { ok: "Notas guardadas." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
}
