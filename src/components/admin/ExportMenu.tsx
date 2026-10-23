"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText, Table } from "lucide-react";
import { btnGhost } from "./ui";

/** Botón "Exportar" con sus formatos: CSV, Excel o ver en PDF */
export default function ExportMenu({ href }: { href: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const url = (formato: string) => `${href}${href.includes("?") ? "&" : "?"}formato=${formato}`;

  /* Se cierra al tocar fuera o con Esc */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options = [
    { formato: "xlsx", label: "Excel", hint: "Archivo .xlsx con filtros", icon: FileSpreadsheet, view: false },
    { formato: "csv", label: "CSV", hint: "Para contabilidad u otros sistemas", icon: Table, view: false },
    { formato: "pdf", label: "Ver en PDF", hint: "Se abre en otra pestaña para ver o imprimir", icon: FileText, view: true },
  ];

  return (
    <div ref={root} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className={btnGhost}>
        <Download size={16} /> Exportar
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="soft-fade absolute right-0 top-full z-30 mt-1 w-72 border border-adm-strong bg-adm-surface py-1">
          {options.map((o) => (
            <a
              key={o.formato}
              role="menuitem"
              href={url(o.formato)}
              {...(o.view ? { target: "_blank", rel: "noopener" } : { download: true })}
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-adm-cyan-tint"
            >
              <o.icon size={17} strokeWidth={1.6} className="mt-0.5 shrink-0 text-adm-cyan-ink" />
              <span>
                <span className="block text-sm font-semibold text-adm-ink">{o.label}</span>
                <span className="block text-xs text-adm-muted">{o.hint}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
