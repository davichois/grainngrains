"use client";

import { useState } from "react";
import { FunctionSquare, ListChecks } from "lucide-react";

/** Dos formas de armar un cupón: la fórmula (estilo Power BI) o el formulario */
export default function CouponTabs({
  formula,
  form,
}: {
  formula: React.ReactNode;
  form: React.ReactNode;
}) {
  const [tab, setTab] = useState<"formula" | "form">("formula");
  const tabs = [
    { id: "formula" as const, label: "Fórmula", icon: FunctionSquare },
    { id: "form" as const, label: "Formulario", icon: ListChecks },
  ];
  return (
    <div>
      <div role="tablist" className="mb-6 flex gap-7 border-b border-adm-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 py-3.5 text-[0.625rem] font-semibold uppercase tracking-[0.2em] transition-colors ${
              tab === t.id ? "border-[#0FC0FC] text-adm-ink" : "border-transparent text-adm-soft hover:text-adm-ink"
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
        <p className="ml-auto hidden self-center text-xs text-adm-faint md:block">
          Las dos guardan el mismo cupón; usa una a la vez.
        </p>
      </div>
      {/* Sin volver a montar (no se pierde lo escrito): la animación se
          repite sola cuando una pestaña oculta vuelve a mostrarse */}
      <div hidden={tab !== "formula"} className="adm-fade">{formula}</div>
      <div hidden={tab !== "form"} className="adm-fade">{form}</div>
    </div>
  );
}
