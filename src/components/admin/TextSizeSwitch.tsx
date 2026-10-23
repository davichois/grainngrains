"use client";

import { useState } from "react";
import { TEXT_COOKIE, type AdminTextSize } from "@/src/lib/admin/theme";

const OPTIONS: { id: AdminTextSize; label: string; sample: string }[] = [
  { id: "sm", label: "Pequeña", sample: "text-[0.8125rem]" },
  { id: "md", label: "Mediana", sample: "text-[0.9375rem]" },
  { id: "lg", label: "Grande", sample: "text-[1.125rem]" },
];

/** Guarda el tamaño y lo aplica sin recargar */
function applyTextSize(t: AdminTextSize) {
  document.cookie = `${TEXT_COOKIE}=${t}; path=/admin; max-age=31536000; samesite=lax`;
  const root = document.documentElement;
  if (t === "md") root.removeAttribute("data-text");
  else root.setAttribute("data-text", t);
}

/** Letra pequeña / mediana / grande (solo para el panel) */
export default function TextSizeSwitch({ initial }: { initial: AdminTextSize }) {
  const [size, setSize] = useState(initial);
  return (
    <div role="radiogroup" aria-label="Tamaño de letra del panel" className="grid grid-cols-3 border border-adm-line3">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={size === o.id}
          onClick={() => {
            setSize(o.id);
            applyTextSize(o.id);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1 py-3 transition-colors ${
            size === o.id ? "bg-[#0FC0FC] text-[#1E1E1E]" : "text-adm-muted hover:text-adm-ink"
          }`}
        >
          <span className={`font-semibold leading-none ${o.sample}`}>Aa</span>
          <span className="text-[0.625rem] font-semibold uppercase tracking-[0.18em]">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
