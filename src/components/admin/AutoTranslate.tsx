"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, Languages, Loader2 } from "lucide-react";
import { translateForm } from "@/src/app/admin/(panel)/actions/translate";
import { fieldCls, labelCls } from "./ui";

/* ───────────────────────────────────────────────────────────────
   Traducción con Claude (Ajustes → Traducción manual apagada).
   Solo se escribe el español; el botón "Traducir automáticamente" llena
   los demás idiomas. Se envían los mismos campos que en modo manual
   (<campo>_<idioma>), así el guardado no cambia.
─────────────────────────────────────────────────────────────── */

export type AutoField = {
  /** Prefijo del campo: name → name_es, name_en… */
  name: string;
  label: string;
  /** Qué es el texto (ayuda a Claude a traducirlo bien) */
  hint: string;
  /** Textos actuales por idioma */
  values: Record<string, string>;
  max: number;
  required?: boolean;
  multiline?: boolean;
  uppercase?: boolean;
  placeholder?: string;
  /** Ocupa toda la fila */
  wide?: boolean;
};

type Status = "idle" | "working";

export default function AutoTranslate({
  fields,
  locales,
  canTranslate,
  columns = "sm:grid-cols-2",
}: {
  fields: AutoField[];
  /** Idiomas de la web (id y nombre), con el español */
  locales: { id: string; name: string }[];
  canTranslate: boolean;
  columns?: string;
}) {
  const others = locales.filter((l) => l.id !== "es");
  const [es, setEs] = useState(() => Object.fromEntries(fields.map((f) => [f.name, f.values.es ?? ""])));
  /* Un idioma que solo repite el español cuenta como sin traducir
     (salvo textos sin palabras, como "250 g", que son iguales en todos) */
  const same = (v: string, es: string) => v === es && /\p{L}{3,}/u.test(es);
  const [texts, setTexts] = useState(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.name,
        Object.fromEntries(others.map((l) => [l.id, f.values[l.id] && !same(f.values[l.id], f.values.es ?? "") ? f.values[l.id] : ""])),
      ]),
    ) as Record<string, Record<string, string>>,
  );
  const complete = (src: Record<string, string>, t: Record<string, Record<string, string>>) =>
    fields.some((f) => src[f.name]?.trim()) && fields.every((f) => !src[f.name] || others.every((l) => t[f.name]?.[l.id]));
  /* El español con el que se hicieron las traducciones que hay */
  const [from, setFrom] = useState<Record<string, string> | null>(() => (complete(es, texts) ? es : null));
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [, start] = useTransition();

  const changed = (name: string) => !from || from[name] !== es[name];
  const stale = Boolean(from) && fields.some((f) => changed(f.name));
  const done = Boolean(from) && !stale && complete(es, texts);
  const hasSpanish = fields.some((f) => es[f.name]?.trim());

  const translate = () => {
    const sent = { ...es };
    setError("");
    setStatus("working");
    start(async () => {
      const r = await translateForm(
        fields.map((f) => ({ key: f.name, hint: f.hint, text: f.uppercase ? sent[f.name].toUpperCase() : sent[f.name] })),
      );
      setStatus("idle");
      if (!r.texts) return setError(r.error ?? "No se pudo traducir.");
      setTexts((prev) =>
        Object.fromEntries(
          fields.map((f) => [
            f.name,
            Object.fromEntries(
              others.map((l) => {
                const v = (r.texts![l.id]?.[f.name] ?? "").slice(0, f.max);
                return [l.id, sent[f.name] ? (f.uppercase ? v.toUpperCase() : v) : prev[f.name]?.[l.id] ?? ""];
              }),
            ),
          ]),
        ),
      );
      setFrom(sent);
    });
  };

  return (
    <div>
      {/* Lo que se envía: el español y, si siguen al día, las traducciones */}
      {fields.map((f) =>
        others.map((l) => (
          <input key={`${f.name}_${l.id}`} type="hidden" name={`${f.name}_${l.id}`} value={changed(f.name) ? "" : texts[f.name]?.[l.id] ?? ""} />
        )),
      )}

      <div className={`grid gap-3 ${columns}`}>
        {fields.map((f) => (
          <label key={f.name} className={`block ${f.wide ? "sm:col-span-2" : ""}`}>
            <span className={labelCls}>
              {f.label} · Español{f.required && " · obligatorio"}
            </span>
            {f.multiline ? (
              <textarea
                name={`${f.name}_es`}
                value={es[f.name]}
                onChange={(e) => setEs((s) => ({ ...s, [f.name]: e.target.value }))}
                rows={2}
                maxLength={f.max}
                required={f.required}
                placeholder={f.placeholder}
                className={fieldCls}
              />
            ) : (
              <input
                name={`${f.name}_es`}
                value={es[f.name]}
                onChange={(e) => setEs((s) => ({ ...s, [f.name]: e.target.value }))}
                maxLength={f.max}
                required={f.required}
                placeholder={f.placeholder}
                className={`${fieldCls} ${f.uppercase ? "uppercase" : ""}`}
              />
            )}
          </label>
        ))}
      </div>

      {/* Botón y estado */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border border-adm-line bg-adm-subtle px-4 py-3">
        <button
          type="button"
          onClick={translate}
          disabled={!canTranslate || status === "working" || !hasSpanish}
          className="inline-flex cursor-pointer items-center gap-2 border border-[#0FC0FC] bg-[#0FC0FC] px-4 py-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[#1E1E1E] transition-colors hover:border-adm-strong hover:bg-adm-solid hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "working" ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
          {status === "working" ? "Traduciendo…" : done ? "Traducir de nuevo" : "Traducir automáticamente"}
        </button>
        <span role="status" className="flex items-center gap-1.5 text-xs font-medium">
          {!canTranslate ? (
            <span className="text-adm-muted">Para traducir con Claude falta ANTHROPIC_API_KEY en el .env.</span>
          ) : status === "working" ? (
            <span className="text-adm-cyan-ink">Claude está traduciendo a {others.length} idiomas…</span>
          ) : done ? (
            <span className="flex items-center gap-1.5 text-adm-cyan-ink"><Check size={14} /> Traducido a {others.length} idiomas</span>
          ) : stale ? (
            <span className="flex items-center gap-1.5 text-adm-red"><AlertCircle size={14} /> Cambiaste el español: vuelve a traducir</span>
          ) : (
            <span className="text-adm-muted">Sin traducir: si guardas así, los otros idiomas muestran el español.</span>
          )}
        </span>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-adm-red">{error}</p>}

      {/* Ver lo traducido */}
      {from && (
        <details className="mt-3 border border-adm-line">
          <summary className="cursor-pointer px-4 py-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-muted hover:text-adm-ink">
            Ver traducciones
          </summary>
          <dl className="divide-y divide-adm-line border-t border-adm-line">
            {others.map((l) => (
              <div key={l.id} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[7rem_1fr]">
                <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-faint">{l.name}</dt>
                <dd className="space-y-0.5 text-sm">
                  {fields.map((f) => (
                    <p key={f.name} className={changed(f.name) ? "text-adm-faint line-through" : ""}>
                      {fields.length > 1 && <span className="mr-1.5 text-xs text-adm-muted">{f.label}:</span>}
                      {texts[f.name]?.[l.id] || <span className="text-adm-faint">—</span>}
                    </p>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </div>
  );
}
