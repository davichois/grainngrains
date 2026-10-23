import "server-only";
import { db, dbReady } from "@/src/lib/db/supabase";
import type { ContactInput, InquiryType } from "@/src/lib/contact";

/* Mensajes del formulario de contacto y cotizaciones, guardados para la
   bandeja del panel. Si la base no está configurada, solo llega el correo. */

export type MessageStatus = "new" | "replied" | "closed";

export interface MessageRow {
  id: string;
  created_at: string;
  type: InquiryType;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  volume: string | null;
  message: string;
  locale: string | null;
  status: MessageStatus;
  notes: string | null;
}

export async function saveMessage(input: ContactInput) {
  if (!dbReady()) return;
  try {
    await db.insert("messages", {
      type: input.type,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      company: input.company || null,
      country: input.country || null,
      volume: input.volume || null,
      message: input.message,
      locale: input.locale,
    });
  } catch (e) {
    console.error("[messages] no se guardó el mensaje", e);
  }
}
