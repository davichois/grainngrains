"use client";

import { Children, isValidElement, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/* ───────────────────────────────────────────────────────────────
   Combo del panel: reemplaza al <select> nativo con una lista propia
   (blanca, líneas finas, sin esquinas redondeadas). Se usa igual que un
   <select>: con <option> dentro, name, defaultValue o value + onChange.
   Guarda el valor en un input oculto para que los formularios lo envíen.
─────────────────────────────────────────────────────────────── */

type Option = { value: string; label: React.ReactNode };

function readOptions(children: React.ReactNode): Option[] {
  const out: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string; children?: React.ReactNode }>(child)) return;
    out.push({ value: String(child.props.value ?? ""), label: child.props.children });
  });
  return out;
}

export default function Select({
  name,
  value,
  defaultValue,
  onChange,
  className = "",
  children,
  "aria-label": ariaLabel,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const options = readOptions(children);
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? "");
  const current = value ?? inner;
  const selected = options.find((o) => o.value === current) ?? options[0];

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();

  /* Cierra al tocar fuera */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  /* La opción activa siempre a la vista */
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const openList = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === current)));
    setOpen(true);
  };

  const choose = (v: string) => {
    setOpen(false);
    if (v === current) return;
    if (value === undefined) setInner(v);
    onChange?.({ target: { value: v } });
    /* Avisa al formulario (p. ej. filtros que se aplican al momento) */
    requestAnimationFrame(() =>
      hidden.current?.dispatchEvent(new Event("change", { bubbles: true })),
    );
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[active]) choose(options[active].value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={root} className="relative">
      {name && <input ref={hidden} type="hidden" name={name} value={current} />}
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKey}
        className={`${className} flex cursor-pointer items-center justify-between gap-3 text-left ${
          open ? "border-[#0FC0FC]" : ""
        }`}
      >
        <span className="min-w-0 truncate">{selected?.label}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.6}
          className={`shrink-0 text-adm-soft transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          className="soft-fade absolute left-0 right-0 top-full z-30 mt-1 max-h-72 min-w-max overflow-y-auto border border-adm-strong bg-adm-surface py-1"
        >
          {options.map((o, i) => {
            const on = o.value === current;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={on}
                onPointerEnter={() => setActive(i)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(o.value)}
                className={`flex cursor-pointer items-center justify-between gap-4 px-3.5 py-2.5 text-sm ${
                  i === active ? "bg-adm-cyan-tint" : ""
                } ${on ? "font-semibold text-adm-ink" : "text-adm-sub"}`}
              >
                <span className="truncate">{o.label}</span>
                {on && <Check size={14} strokeWidth={2} className="shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
