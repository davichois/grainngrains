import "server-only";
import { after } from "next/server";
import { db, dbReady } from "@/src/lib/db/supabase";
import { driveFileId } from "./drive";

/* ───────────────────────────────────────────────────────────────
   Borrado de fotos en Google Drive con el webhook de n8n
   (N8N_DELETE_WEBHOOK_URL). Recibe un JSON { fileId, id, url } y responde
   { ok: true }. Solo se borra una foto que ya no usa ningún café ni
   ninguna edición, y se hace después de responder (no demora el guardado).
─────────────────────────────────────────────────────────────── */

export const canDelete = () => Boolean(process.env.N8N_DELETE_WEBHOOK_URL);

/** Fotos de Drive que hoy usa la tienda (cafés y ediciones) */
async function usedDriveIds() {
  const [products, editions] = await Promise.all([
    db.select<{ image: string | null; hover_image: string | null }>("products", { select: "image,hover_image" }),
    db.select<{ panel_image: string | null }>("editions", { select: "panel_image" }),
  ]);
  return new Set(
    [...products.flatMap((p) => [p.image, p.hover_image]), ...editions.map((e) => e.panel_image)]
      .map(driveFileId)
      .filter(Boolean),
  );
}

async function deleteNow(urls: (string | null | undefined)[]) {
  const hook = process.env.N8N_DELETE_WEBHOOK_URL;
  if (!hook || !dbReady()) return;
  const candidates = [...new Map(urls.map((u) => [driveFileId(u), u] as const).filter(([id]) => id)).entries()];
  if (!candidates.length) return;
  const used = await usedDriveIds();
  await Promise.all(
    candidates
      .filter(([id]) => !used.has(id))
      .map(async ([fileId, url]) => {
        try {
          const res = await fetch(hook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId, id: fileId, url }),
            cache: "no-store",
          });
          if (!res.ok) console.error("[drive] n8n no borró", fileId, res.status);
        } catch (e) {
          console.error("[drive] no se pudo conectar con n8n", e);
        }
      }),
  );
}

/** Borra de Drive las fotos que dejaron de usarse (después de responder) */
export function dropDriveFiles(urls: (string | null | undefined)[]) {
  if (!canDelete() || !urls.some((u) => driveFileId(u))) return;
  try {
    after(() => deleteNow(urls));
  } catch {
    void deleteNow(urls);
  }
}
