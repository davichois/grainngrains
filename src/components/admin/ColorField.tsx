"use client";

import { useState } from "react";
import { fieldCls, labelCls } from "./ui";

/** Color con muestra para elegir y su código (#RRGGBB). Con `optional`
 *  puede quedar vacío (se usa el color por defecto) */
export default function ColorField({
  name,
  label,
  defaultValue,
  optional,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  optional?: boolean;
  hint?: string;
}) {
  const [value, setValue] = useState((defaultValue ?? "").toUpperCase());
  const valid = /^#[0-9A-F]{6}$/i.test(value);
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <span className="flex">
        <span
          className="relative h-[2.625rem] w-12 shrink-0 cursor-pointer border border-r-0 border-adm-line3"
          style={{ background: valid ? value : "repeating-linear-gradient(45deg,var(--adm-panel) 0 6px,var(--adm-surface) 6px 12px)" }}
        >
          <input
            type="color"
            aria-label={`${label}: elegir`}
            value={valid ? value : "#1E1E1E"}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
        <input
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder={optional ? "Vacío = por defecto" : "#RRGGBB"}
          required={!optional}
          pattern="#[0-9A-Fa-f]{6}"
          maxLength={7}
          className={`${fieldCls} uppercase tabular-nums tracking-wide`}
        />
      </span>
      {hint && <span className="mt-1 block text-xs text-adm-soft">{hint}</span>}
    </label>
  );
}
