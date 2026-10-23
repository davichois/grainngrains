"use client";

import { useMemo, useRef, useState } from "react";
import { Check, CloudUpload, Image as ImageIcon, Link2, Loader2, X } from "lucide-react";
import { discardUpload, uploadFile } from "@/src/app/admin/(panel)/actions/upload";
import { driveDirect, isDriveImage } from "@/src/lib/admin/drive";
import type { PublicImage } from "@/src/lib/admin/public-images";
import { fieldCls, labelCls } from "./ui";

type Mode = "web" | "drive" | "link";

/**
 * Foto de un café o de una edición. Se elige de dónde sale:
 *  - Imagen de la web: una que ya está en public/images (galería).
 *  - Subir a Google Drive: el archivo va por el webhook de n8n y se usa
 *    el enlace directo que devuelve.
 *  - Enlace: cualquier https:// (los de Drive para compartir se convierten).
 */
export default function FileField({
  name,
  label,
  defaultValue,
  folder,
  accept = "image/*",
  canUpload,
  library = [],
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  folder: string;
  accept?: string;
  canUpload: boolean;
  /** Imágenes de public/images para elegir */
  library?: PublicImage[];
  required?: boolean;
}) {
  const [url, setUrlState] = useState(defaultValue ?? "");
  /* Fotos subidas a Drive en esta pantalla: si se cambian antes de guardar, se borran */
  const uploaded = useRef(new Set<string>());
  const setUrl = (next: string) => {
    if (next === url) return;
    if (uploaded.current.has(url) && url !== defaultValue) {
      uploaded.current.delete(url);
      void discardUpload(url);
    }
    setUrlState(next);
  };
  /* Sin foto todavía (p. ej. un café nuevo) se empieza por subir a Drive */
  const [mode, setMode] = useState<Mode>(() =>
    !defaultValue ? (canUpload ? "drive" : "web") : defaultValue.startsWith("/") ? "web" : isDriveImage(defaultValue) ? "drive" : "link",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dir, setDir] = useState(() => (defaultValue?.startsWith("/") ? library.find((i) => i.src === defaultValue)?.folder : undefined) ?? "products");
  const input = useRef<HTMLInputElement>(null);

  const folders = useMemo(() => [...new Set(library.map((i) => i.folder))], [library]);
  const shown = library.filter((i) => i.folder === dir);
  const source = !url ? "Sin foto" : url.startsWith("/") ? "Imagen de la web" : isDriveImage(url) ? "Google Drive" : "Enlace externo";

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const r = await uploadFile(form);
    setBusy(false);
    if (r.url) {
      setUrl(r.url);
      uploaded.current.add(r.url);
    }
    else setError(r.error ?? "No se pudo subir.");
  };

  const tabs: { id: Mode; label: string; icon: typeof ImageIcon }[] = [
    { id: "web", label: "Imagen de la web", icon: ImageIcon },
    { id: "drive", label: "Subir a Google Drive", icon: CloudUpload },
    { id: "link", label: "Enlace", icon: Link2 },
  ];

  return (
    <div>
      <span className={labelCls}>{label}</span>
      <input type="hidden" name={name} value={url} required={required} />

      <div className="border border-adm-line">
        {/* Foto actual */}
        <div className="flex items-center gap-3 border-b border-adm-line bg-adm-subtle p-3">
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-adm-line bg-adm-surface">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={20} className="text-adm-faint" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-muted">{source}</span>
            <span className="block truncate text-xs text-adm-sub" title={url}>{url || "Elige una abajo"}</span>
          </span>
          {url && (
            <button type="button" onClick={() => setUrl("")} aria-label="Quitar foto" className="p-1.5 text-adm-muted hover:text-adm-red">
              <X size={16} />
            </button>
          )}
        </div>

        {/* De dónde sale */}
        <div role="tablist" className="flex overflow-x-auto border-b border-adm-line">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={mode === t.id}
              onClick={() => setMode(t.id)}
              className={`-mb-px inline-flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.16em] transition-colors ${
                mode === t.id ? "border-[#0FC0FC] text-adm-ink" : "border-transparent text-adm-soft hover:text-adm-ink"
              }`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-3">
          {mode === "web" &&
            (library.length === 0 ? (
              <p className="text-xs text-adm-muted">No hay imágenes en public/images.</p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {folders.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setDir(f)}
                      className={`cursor-pointer border px-2.5 py-1 text-xs font-semibold transition-colors ${
                        dir === f ? "border-[#0FC0FC] bg-[#0FC0FC] text-[#1E1E1E]" : "border-adm-line3 text-adm-sub hover:border-adm-strong"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
                  {shown.map((img) => {
                    const on = url === img.src;
                    return (
                      <button
                        key={img.src}
                        type="button"
                        onClick={() => setUrl(img.src)}
                        title={img.name}
                        aria-pressed={on}
                        className={`relative aspect-square cursor-pointer overflow-hidden border-2 bg-adm-panel transition-colors ${
                          on ? "border-[#0FC0FC]" : "border-transparent hover:border-adm-line3"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.src} alt={img.name} loading="lazy" className="h-full w-full object-cover" />
                        {on && (
                          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-[#0FC0FC] text-[#1E1E1E]">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ))}

          {mode === "drive" &&
            (canUpload ? (
              <div className="flex flex-wrap items-center gap-3">
                <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                <button
                  type="button"
                  onClick={() => input.current?.click()}
                  disabled={busy}
                  className="inline-flex cursor-pointer items-center gap-2 border border-[#0FC0FC] bg-[#0FC0FC] px-4 py-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[#1E1E1E] hover:border-adm-strong hover:bg-adm-solid hover:text-white disabled:opacity-50"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <CloudUpload size={15} />}
                  {busy ? "Subiendo…" : "Elegir archivo y subir"}
                </button>
                <span className="text-xs text-adm-muted">Se guarda en Google Drive (carpeta «{folder}») y se usa ese enlace.</span>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-adm-muted">
                Para subir a Google Drive falta pegar el webhook de n8n en <code>N8N_UPLOAD_WEBHOOK_URL</code> (.env). Mientras tanto, elige una
                imagen de la web o pega un enlace.
              </p>
            ))}

          {mode === "link" && (
            <div>
              <input
                value={url}
                onChange={(e) => setUrlState(e.target.value)}
                onBlur={(e) => setUrl(driveDirect(e.target.value))}
                placeholder="https://…"
                className={fieldCls}
              />
              <p className="mt-1.5 text-xs text-adm-muted">Si pegas un enlace de Google Drive para compartir, se convierte solo en uno que se puede mostrar.</p>
            </div>
          )}
          {error && <p className="mt-2 text-xs font-medium text-adm-red">{error}</p>}
        </div>
      </div>
    </div>
  );
}
