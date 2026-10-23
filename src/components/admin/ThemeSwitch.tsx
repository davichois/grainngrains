"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { THEME_COOKIE, type AdminTheme } from "@/src/lib/admin/theme";

const OPTIONS: { id: AdminTheme; label: string; icon: typeof Sun }[] = [
  { id: "system", label: "Sistema", icon: Monitor },
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Oscuro", icon: Moon },
];

/** Guarda el tema y lo aplica sin recargar */
function applyTheme(t: AdminTheme) {
  document.cookie = `${THEME_COOKIE}=${t}; path=/admin; max-age=31536000; samesite=lax`;
  const root = document.documentElement;
  if (t === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", t);
}

/** Claro / oscuro / el del sistema (solo para el panel) */
export default function ThemeSwitch({ initial, tabIndex }: { initial: AdminTheme; tabIndex?: number }) {
  const [theme, setTheme] = useState(initial);
  const choose = (t: AdminTheme) => {
    setTheme(t);
    applyTheme(t);
  };
  return (
    <div role="radiogroup" aria-label="Tema del panel" className="flex border border-adm-line3">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={theme === o.id}
          tabIndex={tabIndex}
          onClick={() => choose(o.id)}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 py-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] transition-colors ${
            theme === o.id ? "bg-[#0FC0FC] text-[#1E1E1E]" : "text-adm-muted hover:text-adm-ink"
          }`}
        >
          <o.icon size={14} strokeWidth={1.8} /> {o.label}
        </button>
      ))}
    </div>
  );
}
