"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Plus, Search, X } from "lucide-react";

type Option = { id: string; label: string; active: boolean };
type Picked = { id: string; visible: boolean };

/**
 * Varietales o procesos de un café: se eligen de la lista con un buscador y,
 * de los elegidos, se decide cuáles ve el cliente. Envía los mismos campos
 * que espera saveProduct: `<kind>_on_<id>` y `<kind>_visible_<id>`.
 */
export default function OptionPicker({
  kind,
  title,
  options,
  initial,
}: {
  kind: "varietals" | "processes";
  title: string;
  /** Lista completa (incluidas las inactivas en la lista general) */
  options: Option[];
  /** Las que ya tiene el café */
  initial: { id: string; active: boolean }[];
}) {
  const [picked, setPicked] = useState<Picked[]>(
    initial.filter((i) => options.some((o) => o.id === i.id)).map((i) => ({ id: i.id, visible: i.active })),
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const one = kind === "varietals" ? "varietal" : "proceso";

  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const available = useMemo(
    () => options.filter((o) => !picked.some((p) => p.id === o.id) && norm(o.label).includes(norm(query))),
    [options, picked, query],
  );
  const label = (id: string) => options.find((o) => o.id === id);

  /* Cierra la lista al tocar fuera */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const add = (id: string) => {
    setPicked((p) => [...p, { id, visible: true }]);
    setQuery("");
    setActive(0);
    setOpen(false);
  };

  return (
    <fieldset>
      <legend className="mb-2 block text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-adm-muted">
        {title} · {picked.length} de {options.length}
      </legend>

      {/* Campos que se envían al guardar */}
      {picked.map((p) => (
        <span key={p.id}>
          <input type="hidden" name={`${kind}_on_${p.id}`} value="on" />
          {p.visible && <input type="hidden" name={`${kind}_visible_${p.id}`} value="on" />}
        </span>
      ))}

      {/* Buscador para agregar */}
      <div ref={box} className="relative">
        <label className="relative block">
          <span className="sr-only">Agregar {one}</span>
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-adm-faint" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
                setActive((a) => Math.min(available.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (open && available[active]) add(available[active].id);
              } else if (e.key === "Escape") setOpen(false);
            }}
            placeholder={options.length === picked.length ? `Ya tiene todos` : `Agregar ${one}…`}
            disabled={options.length === picked.length}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${kind}-options`}
            className="w-full border border-adm-line3 bg-adm-surface py-2.5 pl-10 pr-3.5 text-sm outline-none transition-colors placeholder:text-adm-faint hover:border-adm-faint focus:border-[#0FC0FC] disabled:bg-adm-subtle"
          />
        </label>
        {open && available.length > 0 && (
          <ul id={`${kind}-options`} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto border border-adm-strong bg-adm-surface py-1">
            {available.map((o, i) => (
              <li
                key={o.id}
                role="option"
                aria-selected={i === active}
                onPointerEnter={() => setActive(i)}
                onPointerDown={(e) => {
                  e.preventDefault();
                  add(o.id);
                }}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-sm ${i === active ? "bg-adm-cyan-tint" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <Plus size={14} className="text-adm-cyan-ink" />
                  {o.label}
                </span>
                {!o.active && <span className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-adm-red">inactiva en la lista</span>}
              </li>
            ))}
          </ul>
        )}
        {open && query && available.length === 0 && (
          <p className="absolute left-0 right-0 top-full z-30 mt-1 border border-adm-line bg-adm-surface px-3.5 py-2.5 text-sm text-adm-muted">
            No hay {one === "varietal" ? "ninguna varietal" : "ningún proceso"} «{query}». Créalo en Varietales y procesos.
          </p>
        )}
      </div>

      {/* Las que tiene este café */}
      {picked.length === 0 ? (
        <p className="mt-3 text-[0.8125rem] text-adm-muted">
          Este café no tiene {kind === "varietals" ? "varietales" : "procesos"}: el cliente no elige nada.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-adm-line border border-adm-line">
          {picked.map((p) => {
            const o = label(p.id);
            return (
              <li key={p.id} className={`flex items-center gap-3 px-4 py-2.5 ${p.visible ? "" : "bg-adm-subtle"}`}>
                <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${p.visible ? "" : "text-adm-muted line-through decoration-adm-faint"}`}>
                  {o?.label ?? p.id}
                  {o && !o.active && <span className="ml-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-adm-red no-underline">inactiva en la lista</span>}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={p.visible}
                  onClick={() => setPicked((list) => list.map((x) => (x.id === p.id ? { ...x, visible: !x.visible } : x)))}
                  className={`inline-flex cursor-pointer items-center gap-1.5 border px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    p.visible ? "border-[#0FC0FC] bg-adm-cyan-tint text-adm-cyan-ink" : "border-adm-line3 text-adm-muted hover:border-adm-strong"
                  }`}
                >
                  {p.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  {p.visible ? "Visible al cliente" : "Oculta al cliente"}
                </button>
                <button
                  type="button"
                  onClick={() => setPicked((list) => list.filter((x) => x.id !== p.id))}
                  aria-label={`Quitar ${o?.label ?? p.id}`}
                  className="p-1 text-adm-muted transition-colors hover:text-adm-red"
                >
                  <X size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
