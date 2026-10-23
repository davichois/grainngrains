import "server-only";
import { after } from "next/server";
import { db, dbReady } from "@/src/lib/db/supabase";

/* Historial de cambios del panel: qué se hizo, sobre qué y cuándo */

export interface AuditRow {
  id: number;
  at: string;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: Record<string, unknown> | null;
}

/**
 * Anota un cambio. Se escribe después de responder (after), así el "guardado"
 * no espera al historial; fuera de una petición se escribe al momento.
 */
export async function logAudit(
  action: string,
  entity: string,
  entityId?: string,
  detail?: Record<string, unknown>,
) {
  if (!dbReady()) return;
  const write = async () => {
    try {
      await db.insert("audit_log", {
        action,
        entity,
        entity_id: entityId ?? null,
        detail: detail ?? null,
      });
    } catch (e) {
      console.error("[audit]", e);
    }
  };
  try {
    after(write);
  } catch {
    await write();
  }
}
