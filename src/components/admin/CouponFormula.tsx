"use client";

import { useActionState, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Loader2, Search, Sparkles, TriangleAlert } from "lucide-react";
import {
  FUNCTIONS,
  FUNCTION_BY_NAME,
  FORMULA_TEMPLATES,
  argAt,
  evaluateFormula,
  norm,
  signature,
  tokenize,
  valuesFor,
  type FnSpec,
  type FormulaCatalog,
  type Token,
} from "@/src/lib/coupons/formula";
import { saveCouponFormula } from "@/src/app/admin/(panel)/actions/coupons";
import { btnPrimary } from "./ui";

/* ───────────────────────────────────────────────────────────────
   Editor de fórmulas de cupones, al estilo de la barra de fórmulas de
   Power BI: colores, autocompletado (funciones y valores), ayuda de la
   función en curso, errores marcados y vista previa en palabras.
   Atajos: Ctrl+Espacio sugiere · Tab/Enter acepta · Ctrl+Enter guarda.
─────────────────────────────────────────────────────────────── */

const MONO = "font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] text-[0.8438rem] leading-[1.375rem]";
const PAD = "px-4 py-3";

type Suggestion = { label: string; insert: string; detail?: string; cat?: string; cursorBack?: number };

/** Función y argumento en el que está el cursor */
function contextAt(tokens: Token[], cursor: number) {
  const stack: { fn: string; arg: number; values: (string | number)[] }[] = [];
  let prev: Token | null = null;
  let word: Token | null = null;
  let str: Token | null = null;
  for (const t of tokens) {
    if (t.start >= cursor) break;
    if (t.kind === "ident" && t.end >= cursor) word = t;
    if (t.kind === "string" && cursor > t.start && (t.open || cursor < t.end)) str = t;
    if (t.kind === "space" || t.kind === "comment") continue;
    if (t.kind === "lparen") stack.push({ fn: prev?.kind === "ident" ? prev.text.toUpperCase() : "", arg: 0, values: [] });
    else if (t.kind === "rparen" && t.end <= cursor) stack.pop();
    else if (t.kind === "sep") {
      if (stack.length) stack[stack.length - 1].arg++;
    }
    else if ((t.kind === "string" || t.kind === "number") && stack.length && t.end <= cursor && !(t.kind === "string" && t.open))
      stack[stack.length - 1].values[stack[stack.length - 1].arg] = t.value!;
    prev = t;
  }
  return { top: stack[stack.length - 1] ?? null, depth: stack.length, word, str };
}

const TOKEN_CLASS: Partial<Record<Token["kind"], string>> = {
  string: "text-adm-lime-ink",
  number: "text-adm-orange",
  comment: "italic text-adm-faint",
  lparen: "text-adm-soft",
  rparen: "text-adm-soft",
  sep: "text-adm-soft",
  bad: "bg-adm-red-tint text-adm-red",
};

export default function CouponFormula({
  catalog,
  initial,
  original,
  canSave = true,
}: {
  catalog: FormulaCatalog;
  initial: string;
  /** Código del cupón que se edita (vacío = nuevo) */
  original?: string;
  /** Sin base de datos se puede escribir y probar, pero no guardar */
  canSave?: boolean;
}) {
  const [text, setText] = useState(initial);
  const [cursor, setCursor] = useState(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const [filter, setFilter] = useState("");
  /* En pantallas chicas la biblioteca empieza cerrada */
  const [libOpen, setLibOpen] = useState(false);
  const [state, formAction, pending] = useActionState(saveCouponFormula, undefined);
  const area = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0, width: 600 });

  const tokens = useMemo(() => tokenize(text), [text]);
  const result = useMemo(() => evaluateFormula(text, catalog), [text, catalog]);
  const ctx = useMemo(() => contextAt(tokens, cursor), [tokens, cursor]);
  const lines = text.split("\n");
  const width = Math.max(...lines.map((l) => l.length)) + 6;

  /* Función de la que se muestra la ayuda */
  const helpFn: FnSpec | undefined =
    (ctx.top && FUNCTION_BY_NAME.get(ctx.top.fn)) ||
    (ctx.word ? FUNCTION_BY_NAME.get(ctx.word.text.toUpperCase()) : undefined);
  const helpArg = ctx.top && helpFn && helpFn.name === ctx.top.fn ? argAt(helpFn, ctx.top.arg) : undefined;

  /* Sugerencias según dónde está el cursor */
  const suggestions: Suggestion[] = useMemo(() => {
    const fn = ctx.top ? FUNCTION_BY_NAME.get(ctx.top.fn) : undefined;
    const arg = fn && ctx.top ? argAt(fn, ctx.top.arg) : undefined;
    const enumArg = arg && arg.type !== "num" && arg.type !== "text" && !(fn?.name === "CUPON");
    if (ctx.str || (enumArg && !ctx.word)) {
      if (!arg || !fn) return [];
      const typed = ctx.str ? text.slice(ctx.str.start + 1, cursor) : "";
      return valuesFor(arg, catalog, ctx.top?.values)
        .filter((v) => norm(v).includes(norm(typed)))
        .slice(0, 40)
        .map((v) => ({ label: v, insert: `"${v.replace(/"/g, '""')}"`, detail: arg.name, cat: "Valor" }));
    }
    const typed = ctx.word ? text.slice(ctx.word.start, cursor).toUpperCase() : "";
    if (!typed) return [];
    const pool = ctx.depth === 0 ? FUNCTIONS.filter((f) => f.name === "CUPON") : FUNCTIONS.filter((f) => f.name !== "CUPON");
    const k = typed.replace(/_/g, "");
    return pool
      .filter((f) => f.name.replace(/_/g, "").includes(k))
      .sort((a, b) => Number(!a.name.startsWith(typed)) - Number(!b.name.startsWith(typed)) || a.name.localeCompare(b.name))
      .slice(0, 12)
      .map((f) => ({
        label: f.name,
        insert: f.constant ? f.name : `${f.name}()`,
        cursorBack: f.constant ? 0 : 1,
        detail: f.desc,
        cat: f.cat,
      }));
  }, [ctx, text, cursor, catalog]);
  const showList = open && focused && suggestions.length > 0;

  /* Posición del cursor (para la lista de sugerencias) */
  useLayoutEffect(() => {
    const c = caret.current?.getBoundingClientRect();
    const b = bar.current?.getBoundingClientRect();
    if (c && b) setCaretPos({ top: c.top - b.top, left: c.left - b.left, width: b.width });
  }, [text, cursor]);

  const sync = () => {
    const el = area.current;
    if (el) setCursor(el.selectionStart);
  };

  const replace = (from: number, to: number, insert: string, back = 0) => {
    const next = text.slice(0, from) + insert + text.slice(to);
    setText(next);
    const pos = from + insert.length - back;
    requestAnimationFrame(() => {
      area.current?.focus();
      area.current?.setSelectionRange(pos, pos);
      setCursor(pos);
    });
  };

  const accept = (s: Suggestion) => {
    const t = ctx.str ?? ctx.word;
    const from = t ? t.start : cursor;
    const to = t ? (ctx.str ? (ctx.str.open ? cursor : t.end) : t.end) : cursor;
    replace(from, to, s.insert, s.cursorBack ?? 0);
    setOpen(!s.cursorBack ? false : true);
    setActive(0);
  };

  /** Inserta una función desde la biblioteca, con su coma si hace falta */
  const insertFn = (f: FnSpec) => {
    const before = text.slice(0, cursor).trimEnd();
    const needsComma = before.length > 0 && !/[(,;]$/.test(before);
    const inside = contextAt(tokens, cursor).depth > 0;
    if (!inside) {
      /* Fuera de CUPON: va antes del último paréntesis */
      const close = text.lastIndexOf(")");
      if (close > 0) {
        const head = text.slice(0, close).trimEnd();
        const snippet = `${/[(,;]$/.test(head) ? "" : ","}\n    ${f.example}\n`;
        setText(head + snippet + text.slice(close));
        const pos = head.length + snippet.length - 1;
        requestAnimationFrame(() => {
          area.current?.focus();
          area.current?.setSelectionRange(pos, pos);
          setCursor(pos);
        });
        return;
      }
    }
    replace(cursor, cursor, `${needsComma ? ",\n    " : ""}${f.example}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (result.coupon && canSave) form.current?.requestSubmit();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === " ") {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (showList) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        accept(suggestions[Math.min(active, suggestions.length - 1)]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      replace(area.current!.selectionStart, area.current!.selectionEnd, "    ");
    }
  };

  /* Texto coloreado, con los errores subrayados y la marca del cursor */
  const highlighted = useMemo(() => {
    const errs = result.errors.filter((x) => x.end > x.start);
    const cuts = new Set<number>([cursor]);
    for (const t of tokens) cuts.add(t.start).add(t.end);
    for (const x of errs) cuts.add(x.start).add(x.end);
    const points = [...cuts].filter((p) => p >= 0 && p <= text.length).sort((a, b) => a - b);
    const out: React.ReactNode[] = [];
    let ti = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      if (a === cursor) out.push(<span key={`c${a}`} ref={caret} />);
      const b = points[i + 1];
      if (b === undefined || b <= a) continue;
      while (ti < tokens.length && tokens[ti].end <= a) ti++;
      const t = tokens[ti];
      let cls = t ? TOKEN_CLASS[t.kind] ?? "" : "";
      if (t?.kind === "ident") {
        const f = FUNCTION_BY_NAME.get(t.text.toUpperCase());
        cls = f
          ? f.cat === "Premio"
            ? "font-semibold text-adm-cyan-ink"
            : f.cat === "Cupón"
              ? "font-bold text-adm-ink"
              : f.cat === "Opción"
                ? "font-semibold text-adm-violet"
                : "font-semibold text-adm-teal"
          : "text-adm-red";
      }
      const err = errs.some((x) => a >= x.start && b <= x.end);
      out.push(
        <span key={a} className={`${cls} ${err ? "underline decoration-[#D64545] decoration-wavy decoration-from-font underline-offset-4" : ""}`}>
          {text.slice(a, b)}
        </span>,
      );
    }
    return out;
  }, [tokens, result.errors, text, cursor]);

  const jump = (start: number, end: number) => {
    area.current?.focus();
    area.current?.setSelectionRange(start, Math.max(end, start));
    setCursor(start);
  };

  const groups = useMemo(() => {
    const k = norm(filter);
    const list = FUNCTIONS.filter((f) => f.name !== "CUPON" && (!k || norm(`${f.name} ${f.desc} ${f.group}`).includes(k)));
    return [...new Set(list.map((f) => f.group))].map((g) => ({ group: g, fns: list.filter((f) => f.group === g) }));
  }, [filter]);

  const valid = Boolean(result.coupon);

  return (
    <form ref={form} action={formAction} className="space-y-4">
      <input type="hidden" name="formula" value={text} />
      <input type="hidden" name="original" value={original ?? ""} />

      {!original && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-adm-muted">
            <Sparkles size={13} /> Ejemplos
          </span>
          {FORMULA_TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => {
                setText(t.formula);
                requestAnimationFrame(() => area.current?.focus());
              }}
              className="border border-adm-line3 bg-adm-surface px-3 py-1.5 text-xs font-medium transition-colors hover:border-[#0FC0FC] hover:bg-adm-cyan-tint"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-4">
          {/* Barra de fórmula */}
          <div ref={bar} className={`relative border bg-adm-surface ${focused ? "border-[#0FC0FC]" : "border-adm-line3"}`}>
            <div className="flex items-center justify-between border-b border-adm-line bg-adm-subtle px-3 py-2">
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-8 items-center justify-center border border-adm-line3 bg-adm-surface text-[0.75rem] font-semibold italic text-adm-sub">fx</span>
                <span className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-adm-muted">Fórmula del cupón</span>
              </span>
              <span className={`flex items-center gap-1.5 text-xs font-semibold ${valid ? "text-adm-cyan-ink" : "text-adm-red"}`}>
                {valid ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
                {valid ? "Fórmula válida" : `${result.errors.length} error${result.errors.length === 1 ? "" : "es"}`}
              </span>
            </div>

            <div className="flex">
              {/* Números de línea */}
              <div aria-hidden className={`${MONO} select-none border-r border-adm-line bg-adm-subtle py-3 pl-3 pr-2 text-right text-adm-faint`}>
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <div ref={box} className="relative min-w-0 flex-1 overflow-x-auto">
                <div className="relative" style={{ width: `max(100%, ${width}ch)` }}>
                  <pre aria-hidden className={`${MONO} ${PAD} pointer-events-none m-0 whitespace-pre text-adm-ink`}>
                    {highlighted}
                    {"\n"}
                  </pre>
                  <textarea
                    ref={area}
                    value={text}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    aria-label="Fórmula del cupón"
                    rows={lines.length + 1}
                    onChange={(e) => {
                      setText(e.target.value);
                      setCursor(e.target.selectionStart);
                      setOpen(true);
                      setActive(0);
                    }}
                    onSelect={sync}
                    onClick={() => {
                      sync();
                      setOpen(false);
                    }}
                    onKeyUp={(e) => {
                      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) sync();
                    }}
                    onScroll={sync}
                    onKeyDown={onKeyDown}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 150)}
                    className={`${MONO} ${PAD} absolute inset-0 h-full w-full resize-none overflow-hidden whitespace-pre bg-transparent text-transparent caret-adm-ink outline-none selection:bg-[#0FC0FC]/25`}
                  />

                </div>
              </div>
            </div>

            {/* Autocompletar */}
            {showList && (
              <ul
                role="listbox"
                className="absolute z-30 max-h-72 w-[min(30rem,90vw)] overflow-y-auto border border-adm-strong bg-adm-surface py-1"
                style={{ top: caretPos.top + 24, left: Math.max(8, Math.min(caretPos.left - 8, caretPos.width - 320)) }}
              >
                {suggestions.map((s, i) => (
                  <li
                    key={s.label}
                    role="option"
                    aria-selected={i === active}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      accept(s);
                    }}
                    onPointerEnter={() => setActive(i)}
                    className={`flex cursor-pointer items-baseline gap-3 px-3 py-2 ${i === active ? "bg-adm-cyan-tint" : ""}`}
                  >
                    <span className={`${MONO} shrink-0 font-semibold`}>{s.label}</span>
                    {s.detail && <span className="min-w-0 truncate text-xs text-adm-muted">{s.detail}</span>}
                    {s.cat && <span className="ml-auto shrink-0 text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-adm-faint">{s.cat}</span>}
                  </li>
                ))}
              </ul>
            )}

            {/* Ayuda de la función en curso */}
            <div className="min-h-[3.25rem] border-t border-adm-line bg-adm-subtle px-4 py-2.5 text-xs">
              {helpFn ? (
                <>
                  <p className={MONO}>
                    <span className="font-semibold text-adm-cyan-ink">{helpFn.name}</span>
                    {!helpFn.constant && (
                      <>
                        (
                        {[...helpFn.args, ...(helpFn.rest ? [{ ...helpFn.rest, name: `${helpFn.rest.name}…`, optional: true }] : [])].map((a, i, all) => (
                          <span key={i}>
                            <span className={a === helpArg || (helpArg && helpFn.rest === helpArg && i === all.length - 1) ? "bg-[#D4FF47] px-0.5 font-semibold" : "text-adm-sub"}>
                              {a.optional ? `[${a.name}]` : a.name}
                            </span>
                            {i < all.length - 1 && ", "}
                          </span>
                        ))}
                        )
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-adm-muted">{helpFn.desc}</p>
                </>
              ) : (
                <p className="text-adm-soft">
                  Escribe una función (p. ej. <span className={MONO}>PORC…</span>) y elige de la lista con Tab o Enter. <kbd className="border border-adm-line3 bg-adm-surface px-1">Ctrl</kbd>+<kbd className="border border-adm-line3 bg-adm-surface px-1">Espacio</kbd> muestra sugerencias; <kbd className="border border-adm-line3 bg-adm-surface px-1">Ctrl</kbd>+<kbd className="border border-adm-line3 bg-adm-surface px-1">Enter</kbd> guarda.
                </p>
              )}
            </div>
          </div>

          {/* Resultado */}
          <div className="border border-adm-line bg-adm-surface">
            <p className="border-b border-adm-line px-5 py-3 text-[0.625rem] font-semibold uppercase tracking-[0.25em] text-adm-muted">
              {valid ? `Así funciona ${result.coupon!.code}` : "Revisa la fórmula"}
            </p>
            {result.errors.length > 0 ? (
              <ul className="divide-y divide-adm-line">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    <button type="button" onClick={() => jump(e.start, e.end)} className="flex w-full cursor-pointer items-start gap-2.5 px-5 py-3 text-left text-[0.8125rem] hover:bg-adm-red-tint/50">
                      <TriangleAlert size={15} className="mt-0.5 shrink-0 text-adm-red" />
                      <span>
                        {e.message}
                        <span className="ml-2 text-xs text-adm-faint">línea {text.slice(0, e.start).split("\n").length}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="divide-y divide-adm-line">
                {result.lines.map((l, i) => (
                  <li key={i} className="flex items-baseline gap-3 px-5 py-2.5 text-[0.8125rem]">
                    <span
                      className={`w-16 shrink-0 text-[0.5625rem] font-semibold uppercase tracking-[0.18em] ${
                        l.cat === "Premio" ? "text-adm-cyan-ink" : l.cat === "Opción" ? "text-adm-violet" : "text-adm-teal"
                      }`}
                    >
                      {l.cat}
                    </span>
                    {l.text}
                  </li>
                ))}
                {result.coupon?.active === false && <li className="px-5 py-2.5 text-[0.8125rem] text-adm-red">Se guarda pausado (INACTIVO).</li>}
              </ul>
            )}
          </div>

          {state?.error && (
            <p role="alert" className="flex items-start gap-2 bg-adm-red-tint px-4 py-3 text-sm font-medium text-adm-red">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" /> {state.error}
            </p>
          )}
          {state?.ok && !pending && (
            <p role="status" className="flex items-start gap-2 border-l-2 border-[#0FC0FC] bg-adm-cyan-tint px-4 py-3 text-[0.8125rem] font-medium">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {state.ok}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!valid || pending || !canSave} className={btnPrimary}>
              {pending && <Loader2 size={16} className="animate-spin" />}
              {original ? "Guardar cupón" : "Crear cupón"}
            </button>
            {!canSave && <span className="text-xs text-adm-soft">Puedes escribir y probar la fórmula; para guardarla, conecta Supabase.</span>}
          </div>
        </div>

        {/* Biblioteca de funciones */}
        <aside className="border border-adm-line bg-adm-surface xl:max-h-[46rem] xl:overflow-y-auto">
          <button
            type="button"
            onClick={() => setLibOpen((o) => !o)}
            aria-expanded={libOpen}
            className="flex w-full cursor-pointer items-center justify-between px-4 py-3.5 text-[0.625rem] font-semibold uppercase tracking-[0.25em] text-adm-muted xl:hidden"
          >
            Funciones ({FUNCTIONS.length - 1})
            <span className="text-[0.8125rem] normal-case tracking-normal text-adm-cyan-ink">{libOpen ? "Ocultar" : "Ver todas"}</span>
          </button>
          <div className={`${libOpen ? "block" : "hidden"} xl:block`}>
          <div className="sticky top-0 border-b border-adm-line bg-adm-surface p-3">
            <p className="mb-2 hidden text-[0.625rem] font-semibold uppercase tracking-[0.25em] text-adm-muted xl:block">Funciones</p>
            <label className="relative block">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-adm-faint" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buscar: envío, fecha, edición…"
                className="w-full border border-adm-line3 py-2 pl-8 pr-3 text-[0.8125rem] outline-none focus:border-[#0FC0FC]"
              />
            </label>
          </div>
          {groups.map((g) => (
            <div key={g.group}>
              <p className="bg-adm-subtle px-3 py-1.5 text-[0.5625rem] font-semibold uppercase tracking-[0.22em] text-adm-soft">{g.group}</p>
              <ul>
                {g.fns.map((f) => (
                  <li key={f.name}>
                    <button
                      type="button"
                      onClick={() => insertFn(f)}
                      title={`Insertar ${f.example}`}
                      className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-adm-cyan-tint"
                    >
                      <span className={`${MONO} block text-[0.7812rem] font-semibold`}>{signature(f)}</span>
                      <span className="block text-xs leading-snug text-adm-muted">{f.desc}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          </div>
        </aside>
      </div>
    </form>
  );
}
