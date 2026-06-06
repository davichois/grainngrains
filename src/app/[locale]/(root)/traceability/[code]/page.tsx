"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Download, ArrowLeft } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { RECORDS, normalizeCode, type TraceRecordMeta } from "../data";

export default function TraceabilityResult() {
  const t = useTranslations("traceability");

  const params = useParams();
  const rawCode = Array.isArray(params.code) ? params.code[0] : params.code;
  const key = normalizeCode(decodeURIComponent(rawCode ?? ""));

  const steps = t.raw("loadingSteps") as string[];
  const stepCount = steps.length;

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [meta, setMeta] = useState<TraceRecordMeta | null>(null);

  // Reinicia el estado al cambiar de código (la página no se remonta entre lotes)
  const [renderedKey, setRenderedKey] = useState(key);
  if (key !== renderedKey) {
    setRenderedKey(key);
    setLoading(true);
    setStep(0);
    setMeta(null);
  }

  // Simula la consulta a la base de datos de trazabilidad
  useEffect(() => {
    const stepTimers = Array.from({ length: stepCount }, (_, i) =>
      setTimeout(() => setStep(i), i * 700),
    );

    const done = setTimeout(() => {
      setMeta(RECORDS[key] ?? null);
      setLoading(false);
    }, 2800);

    return () => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [key, stepCount]);

  // ── Estado de carga ──
  if (loading) {
    return (
      <section className="mt-10 md:mt-20 flex min-h-[90vh] w-full flex-col items-center justify-center bg-white px-6 text-center text-[#00736B]">
        <Loader2 size={56} className="animate-spin" strokeWidth={3} />
        <p className="mt-8 text-xl font-black uppercase tracking-tight sm:text-2xl">
          {t("loading")}
        </p>
        <p className="mt-2 h-5 text-sm font-medium text-[#00736B]/70 sm:text-base">
          {steps[step]}
        </p>
        <p className="mt-8 border-2 border-[#00736B] px-4 py-1.5 font-mono text-xs uppercase tracking-[0.3em]">
          {t("traceabilityCode")}: {key}
        </p>
      </section>
    );
  }

  // ── No encontrado ──
  if (!meta) {
    return (
      <section className="mt-10 md:mt-20 flex min-h-[90vh] w-full flex-col items-center justify-center bg-white px-6 text-center text-[#00736B]">
        <h1
          className="select-none font-black uppercase leading-[0.85] tracking-[-2px]"
          style={{ fontSize: "clamp(2.5rem, 9vw, 5rem)" }}
        >
          {t("notFoundTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base font-medium text-[#00736B]/80 sm:text-lg">
          {t("notFound")}
        </p>
        <BackLink label={t("back")} />
      </section>
    );
  }

  // Textos traducidos del registro (messages/*.json → traceability.records.<key>)
  const r = (field: string) => t(`records.${key}.${field}`);

  const processMethod = r("processMethod");
  const notesBottom = r("notesBottom");
  const historyTitle = r("historyTitle");
  const historyBody = r("historyBody");

  const lotData: [string, string][] = [
    [t("coffeeFarm"), meta.coffeeFarm],
    [t("origin"), meta.origin],
    [t("altitude"), meta.altitude],
    [t("variety"), meta.variety],
    [t("harvestSeason"), r("harvestSeason")],
    // El método de proceso solo existe en algunos lotes
    ...(processMethod ? [[t("processMethod"), processMethod] as [string, string]] : []),
    [t("dryingMethod"), r("dryingMethod")],
  ];

  const profileData: [string, string][] = [
    [t("texture"), r("texture")],
    [t("fragrance"), r("fragrance")],
    [t("acidity"), r("acidity")],
    [t("sweetness"), r("sweetness")],
    [t("sensation"), r("sensation")],
  ];

  const handleDownload = () => {
    // El PDF del informe está en public/reports/trazabilidad/<CODIGO>.pdf
    // El nombre del archivo usa el código sin espacios (ej. "GG - 691445" → "GG-691445")
    const fileName = `${meta.code.replace(/\s+/g, "")}.pdf`;
    const a = document.createElement("a");
    a.href = `/reports/trazabilidad/${fileName}`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Informe ──
  return (
    <div className="mt-10 md:mt-30 w-full bg-white text-[#25343F]">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-12">
        {/* Encabezado del informe */}
        <header className="border-b-4 border-[#00736B] pb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00736B] sm:text-xs">
            Grain &amp; Grains · {t("reportTitle")}
          </p>
          <h1
            className="mt-2 wrap-break-word font-black uppercase leading-[0.9] tracking-[-1px] text-[#00736B]"
            style={{ fontSize: "clamp(1.625rem, 5vw, 3rem)" }}
          >
            {r("edition")}
          </h1>
          <span className="mt-3 inline-flex items-center  font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#00736B] sm:text-xs">
            {t("traceabilityCode")}: {meta.code}
          </span>
          <p className="mt-3 text-sm font-semibold text-[#25343F]">{r("notesTop")}</p>
          {notesBottom && (
            <p className="text-sm font-medium text-[#25343F]/60">{notesBottom}</p>
          )}
        </header>

        {/* Cuerpo: datos (izquierda) + historia (derecha) */}
        <div
          className={
            historyTitle
              ? "mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-2"
              : "mt-8"
          }
        >
          {/* Columna izquierda: datos */}
          <div>
            <ReportSection title={t("lotData")} rows={lotData} />
            <ReportSection
              title={t("profile")}
              rows={profileData}
              className="mt-8"
            />
          </div>

          {/* Columna derecha: historia */}
          {historyTitle && (
            <aside className="lg:border-l-2 lg:border-[#00736B]/15 lg:pl-12">
              <h2 className="border-b-2 border-[#00736B] pb-2 text-sm font-black uppercase tracking-widest text-[#00736B] sm:text-base">
                {t("history")}
              </h2>
              <p className="mt-4 text-base font-bold italic text-[#00736B] sm:text-lg">
                “{historyTitle}”
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#25343F]/80 sm:text-base">
                {historyBody}
              </p>
            </aside>
          )}
        </div>

        {/* Acciones */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleDownload}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border-4 border-[#00736B] bg-[#00736B] px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-transparent hover:text-[#00736B]"
          >
            <Download size={18} />
            {t("download")}
          </button>
          <Link
            href="/traceability"
            className="inline-flex items-center justify-center gap-2 border-4 border-[#00736B] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#00736B] transition-colors duration-200 hover:bg-[#00736B] hover:text-white"
          >
            <ArrowLeft size={18} />
            {t("back")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ReportSection({
  title,
  rows,
  className = "",
}: {
  title: string;
  rows: [string, string][];
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="border-b-2 border-[#00736B] pb-2 text-sm font-black uppercase tracking-widest text-[#00736B] sm:text-base">
        {title}
      </h2>
      <dl className="divide-y divide-[#25343F]/10">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-1 gap-0.5 py-2.5 sm:grid-cols-[40%_1fr] sm:gap-4"
          >
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#00736B]/70">
              {label}
            </dt>
            <dd className="text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      href="/traceability"
      className="mt-12 inline-flex items-center gap-2 border-4 border-[#00736B] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#00736B] transition-colors duration-200 hover:bg-[#00736B] hover:text-white"
    >
      <ArrowLeft size={18} />
      {label}
    </Link>
  );
}
