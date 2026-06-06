"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Eye, X, FileText } from "lucide-react";
import { CoffeeGrade } from "../types";

export interface ReportFile {
  name: string;
  url: string;
}

interface ReportLabels {
  title: string;
  choose: string;
  preview: string;
  download: string;
  close: string;
}

interface DegreeReportsProps {
  degrees: CoffeeGrade[];
  /** Informes por id de grado (degree1 → grado-1, degree2 → grado-2) */
  reports: Record<string, ReportFile[]>;
  labels: ReportLabels;
  /** Imagen de fondo de cada tarjeta */
  cardImage?: string;
}

export default function DegreeReports({
  degrees,
  reports,
  labels,
  cardImage = "https://cdn.shopify.com/s/files/1/0406/1387/1783/files/green_coffee_cleaned_ready_for_roasting.jpg?v=1674838375",
}: DegreeReportsProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReportFile | null>(null);

  const list = openId ? (reports[openId] ?? []) : [];

  const open = (id: string) => {
    const first = (reports[id] ?? [])[0] ?? null;
    setOpenId(id);
    setSelected(first);
  };
  const close = () => {
    setOpenId(null);
    setSelected(null);
  };

  /* Bloquea el scroll del fondo y cierra con Escape mientras el modal está abierto */
  useEffect(() => {
    if (!openId) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  return (
    <>
      {/* Grilla responsive — móvil/tablet (incl. iPad) en 1 columna; 2 solo en escritorio */}
      <div className="grid grid-cols-1 gap-0 xl:grid-cols-2 xl:h-96">
        {degrees.map((degree) => (
          <div className="group relative overflow-hidden" key={degree.id}>
            <div className="relative w-full h-96 xl:h-full">
              <Image
                src={cardImage}
                alt={degree.title}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 transition-all duration-500 group-hover:bg-black/55" />

            {/* Contenido */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 text-white">
              <h3 className="mb-3 text-2xl sm:text-3xl font-bold uppercase">
                {degree.title}
              </h3>

              {/* Móvil y tablet (incl. iPad): siempre visible; solo en escritorio se revela al hover */}
              <div className="max-h-96 opacity-100 overflow-hidden transition-all duration-500 xl:max-h-0 xl:opacity-0 xl:group-hover:max-h-96 xl:group-hover:opacity-100">
                <p className="mb-4 text-sm leading-relaxed text-white/90">
                  {degree.description}
                </p>

                <button
                  onClick={() => open(degree.id)}
                  className="inline-flex items-center gap-2 cursor-pointer border border-white px-5 py-2 text-xs uppercase tracking-widest transition hover:bg-white hover:text-black"
                >
                  <Download size={14} />
                  {degree.button}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de informes — estética blanco y negro, totalmente responsive */}
      {openId && (
        <div className="fixed inset-0 z-200 flex items-stretch justify-center p-0 sm:items-center sm:p-4 md:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative z-10 flex h-full max-h-full w-full max-w-5xl flex-col overflow-hidden border-0 border-black bg-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:h-[88vh] sm:border">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black bg-black px-4 py-3 text-white sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h4 className="text-sm font-black uppercase tracking-[0.18em] sm:text-lg">
                  {labels.title}
                </h4>
                <p className="mt-0.5 line-clamp-1 text-[11px] font-light tracking-wide text-white/60 sm:text-xs">
                  {labels.choose}
                </p>
              </div>
              <button
                onClick={close}
                aria-label={labels.close}
                className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/40 text-white transition hover:bg-white hover:text-black cursor-pointer sm:h-9 sm:w-9"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cuerpo: lista + previsualización */}
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              {/* Lista de informes (arriba en móvil/tablet, lateral en desktop) */}
              <ul className="max-h-[38vh] shrink-0 overflow-y-auto border-b border-black/15 bg-white p-2.5 sm:p-3 md:max-h-none md:w-72 md:border-b-0 md:border-r lg:w-80">
                {list.map((r, i) => {
                  const active = selected?.url === r.url;
                  return (
                    <li key={r.url}>
                      <div
                        className={`mb-2 border p-2.5 transition-colors sm:p-3 ${
                          active
                            ? "border-black bg-black text-white"
                            : "border-black/15 bg-white text-black hover:border-black"
                        }`}
                      >
                        <button
                          onClick={() => setSelected(r)}
                          className="flex w-full items-start gap-2.5 text-left cursor-pointer sm:gap-3"
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center border text-[10px] font-bold sm:h-7 sm:w-7 sm:text-[11px] ${
                              active
                                ? "border-white/40 text-white"
                                : "border-black/30 text-black"
                            }`}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="flex items-start gap-2 text-[13px] font-semibold leading-snug sm:text-sm">
                            <FileText size={16} className="mt-0.5 shrink-0" />
                            {r.name}
                          </span>
                        </button>
                        <div className="mt-3 flex flex-wrap gap-2 pl-8 sm:pl-10">
                          <button
                            onClick={() => setSelected(r)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                              active
                                ? "bg-white text-black hover:bg-white/80"
                                : "bg-black text-white hover:bg-black/80"
                            }`}
                          >
                            <Eye size={13} />
                            {labels.preview}
                          </button>
                          <a
                            href={r.url}
                            download
                            className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                              active
                                ? "border-white/50 text-white hover:bg-white hover:text-black"
                                : "border-black text-black hover:bg-black hover:text-white"
                            }`}
                          >
                            <Download size={13} />
                            {labels.download}
                          </a>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Previsualización */}
              <div className="relative min-h-0 flex-1 bg-neutral-50">
                {selected ? (
                  <iframe
                    key={selected.url}
                    src={selected.url}
                    title={selected.name}
                    className="h-full min-h-[45vh] w-full md:min-h-0"
                  />
                ) : (
                  <div className="flex h-full min-h-[45vh] items-center justify-center p-6 text-center text-xs uppercase tracking-widest text-black/40 sm:text-sm md:min-h-0">
                    {labels.choose}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
