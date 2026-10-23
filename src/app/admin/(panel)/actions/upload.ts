"use server";

import { requireAdmin } from "@/src/lib/admin/auth";
import { driveDirect } from "@/src/lib/admin/drive";
import { dropDriveFiles } from "@/src/lib/admin/drive-files";

/* Subida de archivos (fotos e informes PDF) con un webhook de n8n que los
   guarda en Google Drive. n8n recibe el archivo en el campo "file" (y la
   carpeta en "folder") y debe responder un JSON con el enlace público:
   { "url": "https://…" }  (también se aceptan "webViewLink" o "link"). */

const MAX_BYTES = 15 * 1024 * 1024;
const TYPES = /^(image\/(png|jpe?g|webp|avif|gif|svg\+xml)|application\/pdf)$/;

export type UploadResult = { url?: string; error?: string };

export async function uploadFile(form: FormData): Promise<UploadResult> {
  await requireAdmin();
  const hook = process.env.N8N_UPLOAD_WEBHOOK_URL;
  if (!hook) return { error: "La subida aún no está configurada (N8N_UPLOAD_WEBHOOK_URL). Pega el enlace a mano." };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Elige un archivo." };
  if (file.size > MAX_BYTES) return { error: "El archivo pesa más de 15 MB." };
  if (!TYPES.test(file.type)) return { error: "Solo imágenes o PDF." };

  const body = new FormData();
  body.append("file", file, file.name);
  body.append("folder", String(form.get("folder") ?? "grain-and-grains"));
  try {
    const res = await fetch(hook, { method: "POST", body, cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const url = [data.url, data.webViewLink, data.link].find(
      (v): v is string => typeof v === "string" && /^https:\/\//.test(v),
    );
    if (!res.ok || !url) return { error: "n8n no devolvió un enlace. Revisa el flujo." };
    /* Enlace de Drive para compartir → enlace directo a la imagen */
    return { url: driveDirect(url) };
  } catch {
    return { error: "No se pudo conectar con n8n." };
  }
}

/** Una foto que se subió y luego se cambió o quitó antes de guardar: se borra
 *  de Drive (solo si ningún café ni edición la usa). */
export async function discardUpload(url: string) {
  await requireAdmin();
  dropDriveFiles([url]);
}
