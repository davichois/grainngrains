"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { ComboView } from "@/src/lib/admin/queries";
import { saveCombo } from "@/src/app/admin/(panel)/actions/combos";
import ActionForm from "./ActionForm";
import AutoTranslate from "./AutoTranslate";
import { Card, fieldCls, labelCls, money } from "./ui";

export interface ComboCoffee {
  /** "edición/café" */
  value: string;
  name: string;
  edition: string;
  /** Precio por presentación (solo las que se venden) */
  prices: Record<string, number>;
  image: string | null;
  cardBg: string;
  active: boolean;
}

type Pick = { value: string; size: string };

/** Formulario de un combo (nuevo sin `combo`), con el precio al momento */
export default function ComboForm({
  combo,
  coffees,
  sizes,
  names,
  locales,
  translation = { manual: true, canTranslate: false },
}: {
  combo?: ComboView;
  coffees: ComboCoffee[];
  sizes: { id: string; label: string }[];
  names?: Record<string, { value: string }>;
  locales: { id: string; name: string }[];
  /** Ajustes → Traducción */
  translation?: { manual: boolean; canTranslate: boolean };
}) {
  const [picked, setPicked] = useState<Pick[]>(
    combo?.items.map((i) => ({ value: `${i.categoryId}/${i.productId}`, size: i.size })) ?? [],
  );
  const [discount, setDiscount] = useState(String(combo?.discount ?? 10));
  const label = (id: string) => sizes.find((x) => x.id === id)?.label ?? id;
  const coffee = (v: string) => coffees.find((c) => c.value === v);

  const { regular, price } = useMemo(() => {
    const regular = picked.reduce((sum, p) => sum + (coffee(p.value)?.prices[p.size] ?? 0), 0);
    const d = Number(discount.replace(",", "."));
    const pct = d > 0 && d < 100 ? d : 0;
    return { regular, price: Math.round(regular * (100 - pct)) / 100 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, discount, coffees]);

  const toggle = (c: ComboCoffee) =>
    setPicked((list) =>
      list.some((p) => p.value === c.value)
        ? list.filter((p) => p.value !== c.value)
        : [...list, { value: c.value, size: c.prices["250g"] ? "250g" : Object.keys(c.prices)[0] }],
    );
  const setSize = (value: string, size: string) =>
    setPicked((list) => list.map((p) => (p.value === value ? { ...p, size } : p)));

  const editions = [...new Set(coffees.map((c) => c.edition))];
  /* Un idioma que solo repite el español se muestra vacío (con el español de guía) */
  const shown = (l: string) => {
    const v = names?.[l]?.value ?? "";
    return l !== "es" && combo?.custom && v === names?.es?.value ? "" : v;
  };

  return (
    <ActionForm action={saveCombo} submit={combo ? "Guardar combo" : "Crear combo"} className="space-y-4">
      <input type="hidden" name="id" value={combo?.id ?? ""} />
      {picked.map((p) => (
        <input key={p.value} type="hidden" name="items" value={`${p.value}/${p.size}`} />
      ))}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-4">
          <Card title="Datos">
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center justify-between gap-3 border border-adm-line px-4 py-3.5 hover:border-adm-faint">
                <span>
                  <span className="block font-semibold">Activo</span>
                  <span className="text-xs text-adm-muted">Pausado, no se ofrece en el carrito.</span>
                </span>
                <input type="checkbox" name="active" defaultChecked={combo ? combo.active : true} className="h-6 w-6 accent-[#0FC0FC]" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>Descuento (%)</span>
                  <input
                    name="discount"
                    inputMode="decimal"
                    required
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className={fieldCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Orden</span>
                  <input name="sort" inputMode="numeric" defaultValue={combo?.sort ?? ""} placeholder="Auto" className={fieldCls} />
                </label>
              </div>
            </div>
          </Card>

          <Card title="Nombre">
            {!translation.manual ? (
              <AutoTranslate
                locales={locales}
                canTranslate={translation.canTranslate}
                fields={[{
                  name: "name",
                  label: "Nombre",
                  hint: "name of a coffee bundle/combo pack",
                  values: Object.fromEntries(locales.map((l) => [l.id, names?.[l.id]?.value ?? ""])),
                  max: 80,
                  required: true,
                  wide: true,
                  placeholder: "Dúo …",
                }]}
              />
            ) : (<>
            <p className="mb-4 text-xs text-adm-muted">
              El español es obligatorio. Completa los demás idiomas a mano; si dejas uno vacío, ese idioma muestra el nombre en español.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {locales.map((l) => (
                <label key={l.id} className={`block ${l.id === "es" ? "sm:col-span-2" : ""}`}>
                  <span className={labelCls}>{l.name} {l.id === "es" && "· obligatorio"}</span>
                  <input
                    name={`name_${l.id}`}
                    defaultValue={shown(l.id)}
                    placeholder={l.id === "es" ? "Dúo …" : names?.es?.value}
                    required={l.id === "es"}
                    maxLength={80}
                    className={fieldCls}
                  />
                </label>
              ))}
            </div>
            </>)}
          </Card>

          <Card title={`Cafés del combo · ${picked.length} elegidos`}>
            <p className="mb-4 text-xs text-adm-muted">
              Elige al menos 2 y, debajo de cada uno, su presentación. Si un café se oculta, se elimina o deja de venderse en esa presentación, el combo deja de mostrarse en la web.
            </p>
            <div className="space-y-5">
              {editions.map((ed) => (
                <fieldset key={ed}>
                  <legend className={`${labelCls} mb-2`}>{ed}</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {coffees
                      .filter((c) => c.edition === ed)
                      .map((c) => {
                        const pick = picked.find((p) => p.value === c.value);
                        const on = Boolean(pick);
                        const own = Object.keys(c.prices);
                        return (
                          <div
                            key={c.value}
                            className={`border transition-colors ${on ? "border-[#0FC0FC] bg-adm-cyan-tint" : "border-adm-line hover:border-adm-faint"} ${c.active ? "" : "opacity-60"}`}
                          >
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={on}
                              onClick={() => toggle(c)}
                              className="flex w-full cursor-pointer items-center gap-3 p-2.5 text-left"
                            >
                              <span className="relative h-11 w-11 shrink-0 overflow-hidden" style={{ backgroundColor: c.cardBg }}>
                                {c.image && <Image src={c.image} alt="" fill sizes="44px" className="object-cover" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold">{c.name}</span>
                                <span className="text-xs text-adm-muted">
                                  {pick ? `${money(c.prices[pick.size] ?? 0)} · ${label(pick.size)}` : own.map((s) => label(s)).join(" · ")}
                                  {!c.active && " · oculto"}
                                </span>
                              </span>
                              <span className={`flex h-5 w-5 shrink-0 items-center justify-center border ${on ? "border-[#0FC0FC] bg-[#0FC0FC] text-[#1E1E1E]" : "border-adm-line3"}`}>
                                {on && <Check size={13} strokeWidth={3} />}
                              </span>
                            </button>
                            {/* Presentación de este café en el combo */}
                            {pick && own.length > 1 && (
                              <div role="radiogroup" aria-label={`Presentación de ${c.name}`} className="flex flex-wrap gap-1.5 border-t border-adm-cyan-line px-2.5 py-2">
                                {own.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    role="radio"
                                    aria-checked={pick.size === s}
                                    onClick={() => setSize(c.value, s)}
                                    className={`cursor-pointer border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                      pick.size === s ? "border-[#0FC0FC] bg-[#0FC0FC] text-[#1E1E1E]" : "border-adm-line3 bg-adm-surface text-adm-sub hover:border-adm-strong"
                                    }`}
                                  >
                                    {label(s)} · {money(c.prices[s])}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </fieldset>
              ))}
            </div>
          </Card>
        </div>

        {/* Precio al momento */}
        <aside className="h-fit border border-adm-line bg-adm-surface lg:sticky lg:top-6">
          <p className="border-b border-adm-line px-5 py-3 text-[0.625rem] font-semibold uppercase tracking-[0.25em] text-adm-muted">Precio del combo</p>
          <div className="space-y-2 px-5 py-4 text-sm">
            <div className="flex justify-between text-adm-muted"><span>Precio normal</span><span className="tabular-nums line-through">{money(regular)}</span></div>
            <div className="flex justify-between text-adm-muted"><span>Descuento</span><span className="tabular-nums">−{money(regular - price)}</span></div>
            <div className="flex items-baseline justify-between border-t border-adm-line pt-3">
              <span className="font-semibold">Precio combo</span>
              <span className="text-2xl font-semibold tabular-nums">{money(price)}</span>
            </div>
            {picked.length < 2 && <p className="pt-1 text-xs text-adm-red">Elige al menos 2 cafés.</p>}
          </div>
        </aside>
      </div>
    </ActionForm>
  );
}
