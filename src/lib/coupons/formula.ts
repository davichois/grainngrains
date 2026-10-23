/* ───────────────────────────────────────────────────────────────
   FÓRMULAS DE CUPONES (estilo Power BI / DAX)

     CUPON("VERANO20",
         PORCENTAJE(20, 40),
         COMPRA_MINIMA(100),
         EDICIONES("Edición Caficultores"),
         AUTOMATICO
     )

   - Funciones en MAYÚSCULAS; argumentos separados por "," o ";".
   - Textos entre comillas ("" dentro de un texto = una comilla).
   - Comentarios con // hasta el final de la línea.
   - Ediciones, cafés y presentaciones se escriben con su nombre (o su id).
   Este archivo no usa nada del servidor: lo usa el editor del panel (para
   autocompletar, avisar errores y la vista previa) y la acción que guarda.
─────────────────────────────────────────────────────────────── */
import type {
  Coupon,
  CouponReward,
  CouponRules,
  CustomerList,
  PaymentKind,
} from "./index";
import { DEPARTMENTS, type GrindId, type ShippingZone } from "@/src/lib/shop";

/* ═════════════════════════ Catálogo ═════════════════════════ */

/** Lo que la fórmula puede nombrar (ediciones, cafés, presentaciones) */
export interface FormulaCatalog {
  editions: { id: string; name: string }[];
  /** Cafés y combos (editionId "combo") */
  products: { id: string; name: string; editionId: string }[];
  sizes: { id: string; label: string }[];
}

export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Nombres cortos de siempre (los cupones viejos los usan) */
const EDITION_ALIASES: Record<string, string> = {
  caficultores: "farmers",
  mujeres: "women",
  clasicos: "classic",
  experimental: "infused",
  experimentales: "infused",
  infusionados: "infused",
};

const GRINDS: { id: GrindId; name: string; alias: string[] }[] = [
  { id: "wholeBean", name: "Grano entero", alias: ["grano"] },
  { id: "coarse", name: "Grueso", alias: ["molido grueso"] },
  { id: "medium", name: "Medio", alias: ["molido medio"] },
  { id: "fine", name: "Fino", alias: ["molido fino"] },
];

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const LOCALES = ["es", "en", "de", "fr", "pt", "zh", "ja", "ko"];

/* ═════════════════════════ Tokens ═════════════════════════ */

export type TokenKind = "ident" | "string" | "number" | "lparen" | "rparen" | "sep" | "comment" | "space" | "bad";
export interface Token {
  kind: TokenKind;
  text: string;
  start: number;
  end: number;
  /** Valor de un texto (sin comillas) o número */
  value?: string | number;
  /** Texto sin cerrar */
  open?: boolean;
}

export function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const start = i;
    if (/\s/.test(c)) {
      while (i < src.length && /\s/.test(src[i])) i++;
      out.push({ kind: "space", text: src.slice(start, i), start, end: i });
    } else if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      out.push({ kind: "comment", text: src.slice(start, i), start, end: i });
    } else if (c === '"') {
      i++;
      let value = "";
      let closed = false;
      while (i < src.length) {
        if (src[i] === '"') {
          if (src[i + 1] === '"') {
            value += '"';
            i += 2;
            continue;
          }
          i++;
          closed = true;
          break;
        }
        value += src[i++];
      }
      out.push({ kind: "string", text: src.slice(start, i), start, end: i, value, open: !closed });
    } else if (/[0-9]/.test(c) || (c === "-" && /[0-9]/.test(src[i + 1] ?? ""))) {
      i++;
      while (i < src.length && /[0-9.]/.test(src[i])) i++;
      const text = src.slice(start, i);
      out.push({ kind: "number", text, start, end: i, value: Number(text) });
    } else if (/[A-Za-zÁÉÍÓÚÑáéíóúñ_]/.test(c)) {
      while (i < src.length && /[A-Za-z0-9ÁÉÍÓÚÑáéíóúñ_]/.test(src[i])) i++;
      out.push({ kind: "ident", text: src.slice(start, i), start, end: i });
    } else if (c === "(") {
      i++;
      out.push({ kind: "lparen", text: c, start, end: i });
    } else if (c === ")") {
      i++;
      out.push({ kind: "rparen", text: c, start, end: i });
    } else if (c === "," || c === ";") {
      i++;
      out.push({ kind: "sep", text: c, start, end: i });
    } else {
      i++;
      out.push({ kind: "bad", text: c, start, end: i });
    }
  }
  return out;
}

/* ═════════════════════════ Árbol ═════════════════════════ */

export type Node =
  | { kind: "call"; name: string; args: Node[]; start: number; end: number; nameEnd: number; parens: boolean }
  | { kind: "string" | "number"; value: string | number; start: number; end: number };

export interface FormulaError {
  message: string;
  start: number;
  end: number;
}

class ParseError extends Error {
  constructor(public err: FormulaError) {
    super(err.message);
  }
}

function parse(src: string): Node | null {
  const toks = tokenize(src).filter((t) => t.kind !== "space" && t.kind !== "comment");
  let i = 0;
  const end = src.length;
  const fail = (message: string, t?: Token): never => {
    throw new ParseError({ message, start: t?.start ?? end, end: t?.end ?? end });
  };

  const value = (): Node => {
    const t = toks[i];
    if (!t) fail("La fórmula está incompleta: falta cerrar un paréntesis o un argumento.");
    if (t.kind === "bad") fail(`Carácter no válido "${t.text}".`, t);
    if (t.kind === "string") {
      if (t.open) fail("Falta cerrar las comillas de este texto.", t);
      i++;
      return { kind: "string", value: t.value as string, start: t.start, end: t.end };
    }
    if (t.kind === "number") {
      if (!Number.isFinite(t.value as number)) fail(`"${t.text}" no es un número válido.`, t);
      i++;
      return { kind: "number", value: t.value as number, start: t.start, end: t.end };
    }
    if (t.kind === "ident") {
      i++;
      const call: Extract<Node, { kind: "call" }> = {
        kind: "call",
        name: t.text.toUpperCase(),
        args: [],
        start: t.start,
        end: t.end,
        nameEnd: t.end,
        parens: false,
      };
      if (toks[i]?.kind === "lparen") {
        i++;
        call.parens = true;
        if (toks[i]?.kind === "rparen") {
          call.end = toks[i++].end;
          return call;
        }
        for (;;) {
          call.args.push(value());
          const n = toks[i];
          if (n?.kind === "sep") {
            i++;
            if (toks[i]?.kind === "rparen") fail("Sobra una coma antes de cerrar el paréntesis.", toks[i]);
            continue;
          }
          if (n?.kind === "rparen") {
            call.end = n.end;
            i++;
            break;
          }
          fail(n ? `Se esperaba "," o ")" y llegó "${n.text}".` : `Falta cerrar el paréntesis de ${call.name}.`, n ?? toks[i - 1]);
        }
      }
      return call;
    }
    return fail(`No se esperaba "${t.text}".`, t);
  };

  if (toks.length === 0) return null;
  const root = value();
  if (i < toks.length) fail(`Sobra "${toks[i].text}" después de la fórmula.`, toks[i]);
  return root;
}

/* ═════════════════════════ Funciones ═════════════════════════ */

export type ArgType =
  | "num"
  | "text"
  | "date"
  | "time"
  | "edition"
  | "product"
  | "size"
  | "grind"
  | "day"
  | "locale"
  | "dept"
  | "choice";

export interface ArgSpec {
  name: string;
  type: ArgType;
  optional?: boolean;
  /** Mínimo para números (por defecto > 0) */
  min?: number;
  int?: boolean;
  choices?: string[];
}

type Piece = { reward?: CouponReward; rules?: CouponRules; options?: Partial<Coupon> };
/** Argumentos ya resueltos (ids) y tal como se escribieron (para explicar) */
type Args = { v: (string | number)[]; d: string[] };

export interface FnSpec {
  name: string;
  cat: "Cupón" | "Premio" | "Regla" | "Opción";
  group: string;
  desc: string;
  args: ArgSpec[];
  /** Argumento que se puede repetir (al final) */
  rest?: ArgSpec;
  /** Se usa sin paréntesis (p. ej. AUTOMATICO) */
  constant?: boolean;
  example: string;
  build: (a: Args) => Piece;
  explain: (a: Args) => string;
}

const n = (a: Args, i: number) => a.v[i] as number;
const s = (a: Args, i: number) => a.v[i] as string;
const strs = (a: Args, from = 0) => a.v.slice(from) as string[];
const nums = (a: Args, from = 0) => a.v.slice(from) as number[];
const soles = (x: number) => `S/ ${x}`;
const lista = (xs: string[]) =>
  xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
const num = (name: string, extra: Partial<ArgSpec> = {}): ArgSpec => ({ name, type: "num", ...extra });

const reward = (r: CouponReward): Piece => ({ reward: r });
const rule = (r: CouponRules): Piece => ({ rules: r });
const opt = (o: Partial<Coupon>): Piece => ({ options: o });
const constant = (
  name: string,
  cat: FnSpec["cat"],
  group: string,
  desc: string,
  piece: Piece,
  explain: string,
): FnSpec => ({ name, cat, group, desc, args: [], constant: true, example: name, build: () => piece, explain: () => explain });

const tiers = (a: Args) => {
  const out: { min: number; percent: number }[] = [];
  for (let i = 0; i < a.v.length; i += 2) out.push({ min: n(a, i), percent: n(a, i + 1) });
  return out;
};

export const FUNCTIONS: FnSpec[] = [
  {
    name: "CUPON",
    cat: "Cupón",
    group: "Cupón",
    desc: "Arma el cupón: su código, un premio y las reglas u opciones que quieras.",
    args: [{ name: "código", type: "text" }],
    rest: { name: "premio, reglas, opciones…", type: "text" },
    example: 'CUPON("VERANO20", PORCENTAJE(20))',
    build: () => ({}),
    explain: (a) => `Código ${a.d[0]}`,
  },

  /* ── Premios (uno por cupón) ── */
  {
    name: "PORCENTAJE", cat: "Premio", group: "Premios",
    desc: "Porcentaje de descuento sobre la compra. El tope (opcional) es el máximo en soles.",
    args: [num("porcentaje", { min: 1 }), num("tope en S/", { optional: true })],
    example: "PORCENTAJE(20, 40)",
    build: (a) => reward({ type: "percent", value: n(a, 0), ...(a.v[1] !== undefined && { maxDiscount: n(a, 1) }) }),
    explain: (a) => `${n(a, 0)}% de descuento${a.v[1] !== undefined ? ` (máximo ${soles(n(a, 1))})` : ""}`,
  },
  {
    name: "MONTO_FIJO", cat: "Premio", group: "Premios",
    desc: "Descuento de un monto fijo en soles.",
    args: [num("soles")], example: "MONTO_FIJO(20)",
    build: (a) => reward({ type: "fixed", value: n(a, 0) }),
    explain: (a) => `${soles(n(a, 0))} de descuento`,
  },
  {
    name: "MONTO_POR_CADA", cat: "Premio", group: "Premios",
    desc: "Soles de descuento por cada tantos soles de compra.",
    args: [num("soles"), num("cada S/")], example: "MONTO_POR_CADA(10, 100)",
    build: (a) => reward({ type: "fixedPer", value: n(a, 0), every: n(a, 1) }),
    explain: (a) => `${soles(n(a, 0))} de descuento por cada ${soles(n(a, 1))}`,
  },
  {
    name: "DESCUENTO_EN_UNO", cat: "Premio", group: "Premios",
    desc: "Porcentaje de descuento en una sola bolsa: la más barata o la más cara.",
    args: [num("porcentaje", { min: 1 }), { name: "cuál", type: "choice", choices: ["más barata", "más cara"], optional: true }],
    example: 'DESCUENTO_EN_UNO(50, "más barata")',
    build: (a) => reward({ type: "percentItem", value: n(a, 0), target: norm(s(a, 1) ?? "").includes("cara") ? "mostExpensive" : "cheapest" }),
    explain: (a) => `${n(a, 0)}% en la bolsa ${norm(s(a, 1) ?? "").includes("cara") ? "más cara" : "más barata"}`,
  },
  constant("GRATIS_EL_MAS_BARATO", "Premio", "Premios", "La bolsa más barata del carrito es gratis.",
    reward({ type: "percentItem", value: 100, target: "cheapest" }), "La bolsa más barata gratis"),
  {
    name: "PRECIO_ESPECIAL", cat: "Premio", group: "Premios",
    desc: "Cada bolsa que recibe el descuento cuesta este precio.",
    args: [num("soles")], example: "PRECIO_ESPECIAL(200)",
    build: (a) => reward({ type: "fixedPrice", price: n(a, 0) }),
    explain: (a) => `Cada bolsa a ${soles(n(a, 0))}`,
  },
  {
    name: "LLEVA_PAGA", cat: "Premio", group: "Premios",
    desc: "Lleva X, paga Y (3x2). Con el % opcional, las de más llevan ese descuento en vez de ser gratis.",
    args: [num("lleva", { int: true }), num("paga", { int: true }), num("% de descuento", { optional: true, min: 1 })],
    example: "LLEVA_PAGA(3, 2)",
    build: (a) => reward({ type: "buyXgetY", buy: n(a, 1), get: n(a, 0) - n(a, 1), ...(a.v[2] !== undefined && { discount: n(a, 2) }) }),
    explain: (a) =>
      a.v[2] !== undefined
        ? `Lleva ${n(a, 0)}, paga ${n(a, 1)} y las demás al ${n(a, 2)}% menos`
        : `Lleva ${n(a, 0)}, paga ${n(a, 1)}`,
  },
  {
    name: "SEGUNDO_AL", cat: "Premio", group: "Premios",
    desc: "La segunda bolsa con este porcentaje de descuento.",
    args: [num("porcentaje", { min: 1 })], example: "SEGUNDO_AL(50)",
    build: (a) => reward({ type: "buyXgetY", buy: 1, get: 1, discount: n(a, 0) }),
    explain: (a) => `La 2.ª bolsa al ${n(a, 0)}% menos`,
  },
  {
    name: "REGALO", cat: "Premio", group: "Premios",
    desc: "Un café de regalo con la compra.",
    args: [
      { name: "edición", type: "edition" },
      { name: "café", type: "product" },
      { name: "presentación", type: "size", optional: true },
      { name: "molienda", type: "grind", optional: true },
      num("cantidad", { optional: true, int: true }),
    ],
    example: 'REGALO("Edición Clásicos", "Clásico de la Mañana", "250 g", "Grano entero")',
    build: (a) =>
      reward({
        type: "gift",
        categoryId: s(a, 0),
        productId: s(a, 1),
        size: (a.v[2] as string) ?? "250g",
        grind: ((a.v[3] as GrindId) ?? "wholeBean"),
        qty: (a.v[4] as number) ?? 1,
      }),
    explain: (a) => `Regalo: ${(a.v[4] as number) ?? 1}× ${a.d[1]}${a.d[2] ? ` de ${a.d[2]}` : ""}`,
  },
  constant("ENVIO_GRATIS", "Premio", "Premios", "El envío no se cobra.", reward({ type: "freeShipping" }), "Envío gratis"),
  {
    name: "DESCUENTO_ENVIO", cat: "Premio", group: "Premios",
    desc: "Soles menos en el costo del envío.",
    args: [num("soles")], example: "DESCUENTO_ENVIO(5)",
    build: (a) => reward({ type: "shippingDiscount", value: n(a, 0) }),
    explain: (a) => `${soles(n(a, 0))} menos en el envío`,
  },
  {
    name: "DESCUENTO_ENVIO_PORCENTAJE", cat: "Premio", group: "Premios",
    desc: "Porcentaje de descuento en el envío.",
    args: [num("porcentaje", { min: 1 })], example: "DESCUENTO_ENVIO_PORCENTAJE(50)",
    build: (a) => reward({ type: "shippingPercent", value: n(a, 0) }),
    explain: (a) => `${n(a, 0)}% menos en el envío`,
  },
  {
    name: "ENVIO_A", cat: "Premio", group: "Premios",
    desc: "El envío cuesta como máximo este monto.",
    args: [num("soles", { min: 0 })], example: "ENVIO_A(5)",
    build: (a) => reward({ type: "shippingFixed", price: n(a, 0) }),
    explain: (a) => `Envío a ${soles(n(a, 0))}`,
  },
  {
    name: "ESCALAS_POR_CANTIDAD", cat: "Premio", group: "Premios",
    desc: "Porcentaje según la cantidad de bolsas, en pares: cantidad mínima, porcentaje, …",
    args: [num("desde (bolsas)", { int: true }), num("porcentaje")],
    rest: num("desde, porcentaje…"),
    example: "ESCALAS_POR_CANTIDAD(3, 10, 6, 15)",
    build: (a) => reward({ type: "tiered", by: "qty", tiers: tiers(a) }),
    explain: (a) => `Por cantidad: ${tiers(a).map((t) => `desde ${t.min} bolsas ${t.percent}%`).join(", ")}`,
  },
  {
    name: "ESCALAS_POR_MONTO", cat: "Premio", group: "Premios",
    desc: "Porcentaje según el monto de compra, en pares: monto mínimo, porcentaje, …",
    args: [num("desde (S/)"), num("porcentaje")],
    rest: num("desde, porcentaje…"),
    example: "ESCALAS_POR_MONTO(200, 5, 400, 10)",
    build: (a) => reward({ type: "tiered", by: "amount", tiers: tiers(a) }),
    explain: (a) => `Por monto: ${tiers(a).map((t) => `desde ${soles(t.min)} ${t.percent}%`).join(", ")}`,
  },

  /* ── Carrito ── */
  {
    name: "COMPRA_MINIMA", cat: "Regla", group: "Carrito",
    desc: "Monto mínimo de compra en soles.", args: [num("soles")], example: "COMPRA_MINIMA(100)",
    build: (a) => rule({ minSubtotal: n(a, 0) }), explain: (a) => `Compra mínima de ${soles(n(a, 0))}`,
  },
  {
    name: "COMPRA_MAXIMA", cat: "Regla", group: "Carrito",
    desc: "Monto máximo de compra en soles.", args: [num("soles")], example: "COMPRA_MAXIMA(500)",
    build: (a) => rule({ maxSubtotal: n(a, 0) }), explain: (a) => `Compra de hasta ${soles(n(a, 0))}`,
  },
  {
    name: "CANTIDAD_MINIMA", cat: "Regla", group: "Carrito",
    desc: "Mínimo de bolsas en el carrito.", args: [num("bolsas", { int: true })], example: "CANTIDAD_MINIMA(2)",
    build: (a) => rule({ minQty: n(a, 0) }), explain: (a) => `Al menos ${n(a, 0)} bolsas`,
  },
  {
    name: "CANTIDAD_MAXIMA", cat: "Regla", group: "Carrito",
    desc: "Máximo de bolsas en el carrito.", args: [num("bolsas", { int: true })], example: "CANTIDAD_MAXIMA(5)",
    build: (a) => rule({ maxQty: n(a, 0) }), explain: (a) => `Hasta ${n(a, 0)} bolsas`,
  },
  {
    name: "VARIEDAD_MINIMA", cat: "Regla", group: "Carrito",
    desc: "Mínimo de cafés distintos en el carrito.", args: [num("cafés", { int: true })], example: "VARIEDAD_MINIMA(3)",
    build: (a) => rule({ minDistinct: n(a, 0) }), explain: (a) => `Al menos ${n(a, 0)} cafés distintos`,
  },
  {
    name: "REQUIERE", cat: "Regla", group: "Carrito",
    desc: "Estos cafés (o combos) deben estar en el carrito.",
    args: [{ name: "café", type: "product" }], rest: { name: "café", type: "product" },
    example: 'REQUIERE("Finca Don Eliseo")',
    build: (a) => rule({ requireProducts: strs(a) }), explain: (a) => `Debe llevar ${lista(a.d)}`,
  },
  {
    name: "REQUIERE_CANTIDAD", cat: "Regla", group: "Carrito",
    desc: "Al menos N bolsas de un café.",
    args: [{ name: "café", type: "product" }, num("bolsas", { int: true })],
    example: 'REQUIERE_CANTIDAD("Finca Don Eliseo", 2)',
    build: (a) => rule({ requireQty: { [s(a, 0)]: n(a, 1) } }), explain: (a) => `Al menos ${a.d[1]} de ${a.d[0]}`,
  },

  /* ── Productos que reciben el descuento ── */
  {
    name: "EDICIONES", cat: "Regla", group: "Productos",
    desc: "El descuento solo vale para estas ediciones.",
    args: [{ name: "edición", type: "edition" }], rest: { name: "edición", type: "edition" },
    example: 'EDICIONES("Edición Mujeres Caficultoras")',
    build: (a) => rule({ editions: strs(a) }), explain: (a) => `Solo ${lista(a.d)}`,
  },
  {
    name: "EXCEPTO_EDICIONES", cat: "Regla", group: "Productos",
    desc: "El descuento no vale para estas ediciones.",
    args: [{ name: "edición", type: "edition" }], rest: { name: "edición", type: "edition" },
    example: 'EXCEPTO_EDICIONES("Edición Experimental")',
    build: (a) => rule({ excludeEditions: strs(a) }), explain: (a) => `Excepto ${lista(a.d)}`,
  },
  {
    name: "PRODUCTOS", cat: "Regla", group: "Productos",
    desc: "El descuento solo vale para estos cafés.",
    args: [{ name: "café", type: "product" }], rest: { name: "café", type: "product" },
    example: 'PRODUCTOS("Finca Don Edwin", "Hijas del Bosque")',
    build: (a) => rule({ products: strs(a) }), explain: (a) => `Solo en ${lista(a.d)}`,
  },
  {
    name: "EXCEPTO_PRODUCTOS", cat: "Regla", group: "Productos",
    desc: "El descuento no vale para estos cafés.",
    args: [{ name: "café", type: "product" }], rest: { name: "café", type: "product" },
    example: 'EXCEPTO_PRODUCTOS("Finca Don Osmar")',
    build: (a) => rule({ excludeProducts: strs(a) }), explain: (a) => `Excepto ${lista(a.d)}`,
  },
  {
    name: "PRESENTACION", cat: "Regla", group: "Productos",
    desc: "El descuento solo vale para estas presentaciones.",
    args: [{ name: "presentación", type: "size" }], rest: { name: "presentación", type: "size" },
    example: 'PRESENTACION("1 kg")',
    build: (a) => rule({ sizes: strs(a) }), explain: (a) => `Solo en ${lista(a.d)}`,
  },
  {
    name: "MOLIENDAS", cat: "Regla", group: "Productos",
    desc: "El descuento solo vale para estas moliendas.",
    args: [{ name: "molienda", type: "grind" }], rest: { name: "molienda", type: "grind" },
    example: 'MOLIENDAS("Grano entero")',
    build: (a) => rule({ grinds: strs(a) as GrindId[] }), explain: (a) => `Solo molienda ${lista(a.d)}`,
  },
  {
    name: "LIMITE_UNIDADES", cat: "Regla", group: "Productos",
    desc: "El descuento alcanza como máximo a N bolsas (las más caras).",
    args: [num("bolsas", { int: true })], example: "LIMITE_UNIDADES(2)",
    build: (a) => rule({ maxDiscountedUnits: n(a, 0) }), explain: (a) => `Descuento en máximo ${n(a, 0)} bolsas`,
  },
  {
    name: "TOPE_DESCUENTO", cat: "Regla", group: "Productos",
    desc: "Máximo de descuento en soles, para cualquier premio.",
    args: [num("soles")], example: "TOPE_DESCUENTO(50)",
    build: (a) => rule({ maxDiscount: n(a, 0) }), explain: (a) => `Descuento máximo de ${soles(n(a, 0))}`,
  },
  constant("SIN_COMBOS", "Regla", "Productos", "No aplica a los combos.", rule({ excludeCombos: true }), "No aplica a combos"),
  constant("SOLO_COMBOS", "Regla", "Productos", "Solo aplica a los combos.", rule({ onlyCombos: true }), "Solo combos"),

  /* ── Cliente ── */
  constant("PRIMERA_COMPRA", "Regla", "Cliente", "Solo para la primera compra del cliente.", rule({ firstPurchase: true }), "Solo primera compra"),
  {
    name: "CLIENTE_FRECUENTE", cat: "Regla", group: "Cliente",
    desc: "Clientes con al menos N compras pagadas antes.",
    args: [num("compras", { int: true })], example: "CLIENTE_FRECUENTE(3)",
    build: (a) => rule({ minPreviousOrders: n(a, 0) }), explain: (a) => `Clientes con ${n(a, 0)}+ compras`,
  },
  constant("SUSCRIPTORES", "Regla", "Cliente", "Solo si acepta recibir novedades.", rule({ newsletter: true }), "Solo suscritos a novedades"),
  constant("MAYORISTA", "Regla", "Cliente", "Solo con Factura (RUC).", rule({ wholesale: true }), "Solo con factura"),
  constant("SOLO_BOLETA", "Regla", "Cliente", "Solo con Boleta (consumidor final).", rule({ consumerOnly: true }), "Solo con boleta"),
  {
    name: "CORREOS", cat: "Regla", group: "Cliente",
    desc: "Solo estos correos pueden usarlo.",
    args: [{ name: "correo", type: "text" }], rest: { name: "correo", type: "text" },
    example: 'CORREOS("ana@correo.com")',
    build: (a) => rule({ customers: { emails: strs(a).map((x) => x.toLowerCase()) } }), explain: (a) => `Solo ${lista(a.d)}`,
  },
  {
    name: "DOMINIOS", cat: "Regla", group: "Cliente",
    desc: "Solo correos de estos dominios (p. ej. miempresa.com).",
    args: [{ name: "dominio", type: "text" }], rest: { name: "dominio", type: "text" },
    example: 'DOMINIOS("miempresa.com")',
    build: (a) => rule({ customers: { domains: strs(a).map((x) => x.toLowerCase().replace(/^@/, "")) } }),
    explain: (a) => `Solo correos @${lista(a.d.map((x) => x.replace(/^@/, "")))}`,
  },
  {
    name: "DOCUMENTOS", cat: "Regla", group: "Cliente",
    desc: "Solo estos DNI o RUC.",
    args: [{ name: "DNI o RUC", type: "text" }], rest: { name: "DNI o RUC", type: "text" },
    example: 'DOCUMENTOS("12345678")',
    build: (a) => rule({ customers: { documents: strs(a) } }), explain: (a) => `Solo documentos ${lista(a.d)}`,
  },
  {
    name: "EXCEPTO_CORREOS", cat: "Regla", group: "Cliente",
    desc: "Estos correos no pueden usarlo.",
    args: [{ name: "correo", type: "text" }], rest: { name: "correo", type: "text" },
    example: 'EXCEPTO_CORREOS("ana@correo.com")',
    build: (a) => rule({ excludeCustomers: { emails: strs(a).map((x) => x.toLowerCase()) } }), explain: (a) => `Excepto ${lista(a.d)}`,
  },
  {
    name: "EXCEPTO_DOMINIOS", cat: "Regla", group: "Cliente",
    desc: "Correos de estos dominios no pueden usarlo.",
    args: [{ name: "dominio", type: "text" }], rest: { name: "dominio", type: "text" },
    example: 'EXCEPTO_DOMINIOS("competencia.com")',
    build: (a) => rule({ excludeCustomers: { domains: strs(a).map((x) => x.toLowerCase().replace(/^@/, "")) } }),
    explain: (a) => `Excepto correos @${lista(a.d.map((x) => x.replace(/^@/, "")))}`,
  },
  {
    name: "EXCEPTO_DOCUMENTOS", cat: "Regla", group: "Cliente",
    desc: "Estos DNI o RUC no pueden usarlo.",
    args: [{ name: "DNI o RUC", type: "text" }], rest: { name: "DNI o RUC", type: "text" },
    example: 'EXCEPTO_DOCUMENTOS("12345678")',
    build: (a) => rule({ excludeCustomers: { documents: strs(a) } }), explain: (a) => `Excepto documentos ${lista(a.d)}`,
  },
  {
    name: "IDIOMAS", cat: "Regla", group: "Cliente",
    desc: "Solo para quien compra en la web en estos idiomas.",
    args: [{ name: "idioma", type: "locale" }], rest: { name: "idioma", type: "locale" },
    example: 'IDIOMAS("en", "de")',
    build: (a) => rule({ locales: strs(a) }), explain: (a) => `Solo web en ${lista(a.d)}`,
  },

  /* ── Pago y envío ── */
  constant("SOLO_TARJETA", "Regla", "Pago y envío", "Solo pagando con tarjeta.", rule({ paymentMethods: ["card"] as PaymentKind[] }), "Solo con tarjeta"),
  constant("SOLO_YAPE", "Regla", "Pago y envío", "Solo pagando con Yape.", rule({ paymentMethods: ["wallet"] as PaymentKind[] }), "Solo con Yape"),
  constant("SOLO_LIMA", "Regla", "Pago y envío", "Solo envíos a Lima y Callao.", rule({ zones: ["lima"] as ShippingZone[] }), "Solo Lima y Callao"),
  constant("SOLO_PROVINCIAS", "Regla", "Pago y envío", "Solo envíos a provincias.", rule({ zones: ["provinces"] as ShippingZone[] }), "Solo provincias"),
  {
    name: "DEPARTAMENTOS", cat: "Regla", group: "Pago y envío",
    desc: "Solo envíos a estos departamentos.",
    args: [{ name: "departamento", type: "dept" }], rest: { name: "departamento", type: "dept" },
    example: 'DEPARTAMENTOS("Arequipa", "Cusco")',
    build: (a) => rule({ departments: strs(a) }), explain: (a) => `Solo envíos a ${lista(a.d)}`,
  },
  {
    name: "EXCEPTO_DEPARTAMENTOS", cat: "Regla", group: "Pago y envío",
    desc: "No vale para envíos a estos departamentos.",
    args: [{ name: "departamento", type: "dept" }], rest: { name: "departamento", type: "dept" },
    example: 'EXCEPTO_DEPARTAMENTOS("Loreto")',
    build: (a) => rule({ excludeDepartments: strs(a) }), explain: (a) => `Excepto envíos a ${lista(a.d)}`,
  },

  /* ── Fechas y horarios (hora de Lima) ── */
  {
    name: "VIGENCIA", cat: "Regla", group: "Fechas y horarios",
    desc: 'Desde y hasta cuándo vale: "AAAA-MM-DD" o con hora "AAAA-MM-DD HH:MM".',
    args: [{ name: "inicio", type: "date" }, { name: "fin", type: "date" }],
    example: 'VIGENCIA("2026-12-01", "2026-12-31")',
    build: (a) => rule({ validFrom: s(a, 0), validUntil: s(a, 1) }), explain: (a) => `Del ${a.d[0]} al ${a.d[1]}`,
  },
  {
    name: "DESDE", cat: "Regla", group: "Fechas y horarios",
    desc: "Vale desde esta fecha.", args: [{ name: "fecha", type: "date" }], example: 'DESDE("2026-12-01")',
    build: (a) => rule({ validFrom: s(a, 0) }), explain: (a) => `Desde el ${a.d[0]}`,
  },
  {
    name: "HASTA", cat: "Regla", group: "Fechas y horarios",
    desc: "Vale hasta esta fecha.", args: [{ name: "fecha", type: "date" }], example: 'HASTA("2026-12-31 23:59")',
    build: (a) => rule({ validUntil: s(a, 0) }), explain: (a) => `Hasta el ${a.d[0]}`,
  },
  {
    name: "DIAS", cat: "Regla", group: "Fechas y horarios",
    desc: "Solo estos días de la semana.",
    args: [{ name: "día", type: "day" }], rest: { name: "día", type: "day" },
    example: 'DIAS("Viernes", "Sábado")',
    build: (a) => rule({ daysOfWeek: nums(a) }), explain: (a) => `Solo ${lista(a.d)}`,
  },
  constant("FIN_DE_SEMANA", "Regla", "Fechas y horarios", "Solo sábados y domingos.", rule({ daysOfWeek: [6, 0] }), "Solo fines de semana"),
  {
    name: "FECHAS", cat: "Regla", group: "Fechas y horarios",
    desc: 'Solo estas fechas sueltas ("AAAA-MM-DD").',
    args: [{ name: "fecha", type: "date" }], rest: { name: "fecha", type: "date" },
    example: 'FECHAS("2026-07-28", "2026-07-29")',
    build: (a) => rule({ dates: strs(a) }), explain: (a) => `Solo el ${lista(a.d)}`,
  },
  {
    name: "DIAS_DEL_MES", cat: "Regla", group: "Fechas y horarios",
    desc: "Solo estos días del mes (-1 = el último).",
    args: [num("día", { min: -1, int: true })], rest: num("día", { min: -1, int: true }),
    example: "DIAS_DEL_MES(1, 15)",
    build: (a) => rule({ monthDays: nums(a) }),
    explain: (a) => `Los días ${lista(nums(a).map((d) => (d === -1 ? "último" : String(d))))} de cada mes`,
  },
  constant("QUINCENA", "Regla", "Fechas y horarios", "Días de pago: el 15 y el último del mes.", rule({ monthDays: [15, -1] }), "Días 15 y último de cada mes"),
  constant("FIN_DE_MES", "Regla", "Fechas y horarios", "Solo el último día del mes.", rule({ monthDays: [-1] }), "Último día de cada mes"),
  {
    name: "HORARIO", cat: "Regla", group: "Fechas y horarios",
    desc: 'Solo en este horario ("HH:MM"); puede cruzar la medianoche.',
    args: [{ name: "de", type: "time" }, { name: "a", type: "time" }],
    example: 'HORARIO("06:00", "10:00")',
    build: (a) => rule({ hours: { from: s(a, 0), to: s(a, 1) } }), explain: (a) => `De ${a.d[0]} a ${a.d[1]}`,
  },

  /* ── Límites de uso ── */
  {
    name: "USOS_MAXIMOS", cat: "Regla", group: "Límites de uso",
    desc: "Veces en total que se puede usar.", args: [num("usos", { int: true })], example: "USOS_MAXIMOS(100)",
    build: (a) => rule({ maxUses: n(a, 0) }), explain: (a) => `Máximo ${n(a, 0)} usos en total`,
  },
  {
    name: "USOS_POR_CLIENTE", cat: "Regla", group: "Límites de uso",
    desc: "Veces que cada cliente lo puede usar.", args: [num("usos", { int: true })], example: "USOS_POR_CLIENTE(2)",
    build: (a) => rule({ maxUsesPerCustomer: n(a, 0) }), explain: (a) => `Máximo ${n(a, 0)} usos por cliente`,
  },
  constant("UNA_VEZ_POR_CLIENTE", "Regla", "Límites de uso", "Cada cliente lo usa una sola vez.", rule({ maxUsesPerCustomer: 1 }), "Una vez por cliente"),
  {
    name: "USOS_POR_DIA", cat: "Regla", group: "Límites de uso",
    desc: "Usos máximos por día (se reinicia a medianoche).", args: [num("usos", { int: true })], example: "USOS_POR_DIA(20)",
    build: (a) => rule({ maxUsesPerDay: n(a, 0) }), explain: (a) => `Máximo ${n(a, 0)} usos por día`,
  },
  {
    name: "PRESUPUESTO", cat: "Regla", group: "Límites de uso",
    desc: "Soles de descuento totales que se pueden regalar.", args: [num("soles")], example: "PRESUPUESTO(1000)",
    build: (a) => rule({ budget: n(a, 0) }), explain: (a) => `Presupuesto de ${soles(n(a, 0))} en descuentos`,
  },

  /* ── Opciones ── */
  constant("AUTOMATICO", "Opción", "Opciones", "Se aplica solo, sin escribir el código.", opt({ autoApply: true }), "Se aplica solo"),
  constant("ACUMULABLE", "Opción", "Opciones", "Se suma con otras promociones acumulables.", opt({ stackable: true }), "Se suma con otras promociones"),
  constant("EXCLUSIVO", "Opción", "Opciones", "No se combina con nada.", opt({ exclusive: true }), "No se combina con nada"),
  constant("INACTIVO", "Opción", "Opciones", "Guardado pero pausado (no se puede usar).", opt({ active: false }), "Pausado"),
  {
    name: "ALIAS", cat: "Opción", group: "Opciones",
    desc: "Otros códigos para el mismo cupón.",
    args: [{ name: "código", type: "text" }], rest: { name: "código", type: "text" },
    example: 'ALIAS("ANA10", "LUIS10")',
    build: (a) => opt({ aliases: strs(a).map((x) => x.trim().toUpperCase()) }), explain: (a) => `También con ${lista(a.d.map((x) => x.toUpperCase()))}`,
  },
  {
    name: "NOTA", cat: "Opción", group: "Opciones",
    desc: "Nota interna (no se muestra al cliente).",
    args: [{ name: "texto", type: "text" }], example: 'NOTA("Campaña de verano")',
    build: (a) => opt({ note: s(a, 0) }), explain: (a) => `Nota: ${a.d[0]}`,
  },
];

export const FUNCTION_BY_NAME = new Map(FUNCTIONS.map((f) => [f.name, f]));

/** Firma para mostrar: PORCENTAJE(porcentaje, [tope en S/]) */
export function signature(f: FnSpec) {
  if (f.constant) return f.name;
  const parts = f.args.map((a) => (a.optional ? `[${a.name}]` : a.name));
  if (f.rest) parts.push(`[${f.rest.name}…]`);
  return `${f.name}(${parts.join(", ")})`;
}

/** Argumento que corresponde a la posición i */
export const argAt = (f: FnSpec, i: number): ArgSpec | undefined =>
  f.args[i] ?? f.rest;

/* ═════════════════════════ Valores sugeridos ═════════════════════════ */

/** Valores posibles de un argumento (para autocompletar) */
export function valuesFor(arg: ArgSpec, cat: FormulaCatalog, fnArgs: (string | number)[] = []): string[] {
  switch (arg.type) {
    case "edition":
      return cat.editions.map((e) => e.name);
    case "product": {
      /* En REGALO, los cafés de la edición elegida primero */
      const ed = typeof fnArgs[0] === "string" ? resolveEdition(fnArgs[0], cat) : null;
      return [...cat.products]
        .sort((a, b) => Number(b.editionId === ed) - Number(a.editionId === ed))
        .map((p) => p.name);
    }
    case "size":
      return cat.sizes.map((x) => x.label);
    case "grind":
      return GRINDS.map((g) => g.name);
    case "day":
      return DAYS;
    case "locale":
      return LOCALES;
    case "dept":
      return [...DEPARTMENTS];
    case "choice":
      return arg.choices ?? [];
    case "date":
      return [new Date().toISOString().slice(0, 10)];
    case "time":
      return ["06:00", "12:00", "18:00", "23:59"];
    default:
      return [];
  }
}

function resolveEdition(v: string, cat: FormulaCatalog) {
  const k = norm(v);
  return (
    cat.editions.find((e) => e.id === v || norm(e.id) === k)?.id ??
    cat.editions.find((e) => norm(e.name) === k || norm(e.name).replace(/^edicion /, "") === k)?.id ??
    (EDITION_ALIASES[k] && cat.editions.some((e) => e.id === EDITION_ALIASES[k]) ? EDITION_ALIASES[k] : null)
  );
}
function resolveProduct(v: string, cat: FormulaCatalog) {
  const k = norm(v);
  return cat.products.find((p) => p.id === v || norm(p.id) === k)?.id ?? cat.products.find((p) => norm(p.name) === k)?.id ?? null;
}
function resolveSize(v: string, cat: FormulaCatalog) {
  const k = norm(v).replace(/\s/g, "");
  return cat.sizes.find((x) => x.id === v || norm(x.id) === k || norm(x.label).replace(/\s/g, "") === k)?.id ?? null;
}
const resolveGrind = (v: string) => {
  const k = norm(v);
  return GRINDS.find((g) => g.id === v || norm(g.name) === k || g.alias.includes(k))?.id ?? null;
};
const resolveDay = (v: string) => {
  const k = norm(v);
  const i = DAYS.findIndex((d) => norm(d) === k);
  return i >= 0 ? i : null;
};
const resolveDept = (v: string) => DEPARTMENTS.find((d) => norm(d) === norm(v)) ?? null;

const FECHA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])( ([01]\d|2[0-3]):[0-5]\d)?$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/* ═════════════════════════ Evaluar ═════════════════════════ */

export interface FormulaResult {
  coupon: Coupon | null;
  errors: FormulaError[];
  /** Frases de la vista previa: premio, reglas y opciones */
  lines: { cat: FnSpec["cat"]; text: string }[];
}

const mergeList = (a: CustomerList = {}, b: CustomerList): CustomerList => ({
  ...(a.emails || b.emails ? { emails: [...(a.emails ?? []), ...(b.emails ?? [])] } : {}),
  ...(a.domains || b.domains ? { domains: [...(a.domains ?? []), ...(b.domains ?? [])] } : {}),
  ...(a.documents || b.documents ? { documents: [...(a.documents ?? []), ...(b.documents ?? [])] } : {}),
});

/** Convierte la fórmula en un cupón (o dice qué está mal y dónde) */
export function evaluateFormula(src: string, cat: FormulaCatalog): FormulaResult {
  const errors: FormulaError[] = [];
  const lines: FormulaResult["lines"] = [];
  let root: Node | null;
  try {
    root = parse(src);
  } catch (e) {
    if (e instanceof ParseError) return { coupon: null, errors: [e.err], lines };
    throw e;
  }
  if (!root) return { coupon: null, errors: [{ message: 'Escribe la fórmula: CUPON("CODIGO", …)', start: 0, end: 0 }], lines };
  if (root.kind !== "call" || root.name !== "CUPON")
    return { coupon: null, errors: [{ message: 'La fórmula debe empezar con CUPON("CODIGO", …).', start: root.start, end: root.end }], lines };

  const [codeNode, ...partNodes] = root.args;
  let code = "";
  if (!codeNode || codeNode.kind !== "string") {
    errors.push({ message: 'El primer argumento de CUPON es el código entre comillas, p. ej. "VERANO20".', start: codeNode?.start ?? root.nameEnd, end: codeNode?.end ?? root.end });
  } else {
    code = String(codeNode.value).trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,40}$/.test(code))
      errors.push({ message: "El código debe tener de 3 a 40 letras, números, - o _ (sin espacios).", start: codeNode.start, end: codeNode.end });
  }

  let reward: CouponReward | null = null;
  const rules: CouponRules = {};
  let options: Partial<Coupon> = {};

  for (const node of partNodes) {
    if (node.kind !== "call") {
      errors.push({ message: "Aquí va una función (p. ej. PORCENTAJE(20)), no un valor suelto.", start: node.start, end: node.end });
      continue;
    }
    const fn = FUNCTION_BY_NAME.get(node.name);
    if (!fn || fn.name === "CUPON") {
      const close = FUNCTIONS.find((f) => f.name.startsWith(node.name.slice(0, 4)));
      errors.push({
        message: fn ? "CUPON va una sola vez, al inicio." : `No existe la función ${node.name}.${close ? ` ¿Quisiste decir ${close.name}?` : ""}`,
        start: node.start,
        end: node.nameEnd,
      });
      continue;
    }
    if (fn.constant && node.parens && node.args.length) {
      errors.push({ message: `${fn.name} no lleva argumentos.`, start: node.start, end: node.end });
      continue;
    }
    if (!fn.constant && !node.parens) {
      errors.push({ message: `Faltan los paréntesis: ${signature(fn)}`, start: node.start, end: node.end });
      continue;
    }
    const required = fn.args.filter((a) => !a.optional).length;
    if (node.args.length < required) {
      errors.push({ message: `Faltan argumentos: ${signature(fn)}`, start: node.start, end: node.end });
      continue;
    }
    if (!fn.rest && node.args.length > fn.args.length) {
      errors.push({ message: `Sobran argumentos: ${signature(fn)}`, start: node.args[fn.args.length].start, end: node.end });
      continue;
    }
    if (fn.name.startsWith("ESCALAS") && node.args.length % 2 !== 0) {
      errors.push({ message: "Las escalas van en pares: desde, porcentaje, desde, porcentaje…", start: node.start, end: node.end });
      continue;
    }

    /* Argumentos: tipo y valor */
    const a: Args = { v: [], d: [] };
    let bad = false;
    node.args.forEach((arg, i) => {
      if (bad) return;
      const spec = argAt(fn, i)!;
      const err = (message: string) => {
        errors.push({ message, start: arg.start, end: arg.end });
        bad = true;
      };
      if (spec.type === "num") {
        if (arg.kind !== "number") return err(`"${spec.name}" de ${fn.name} es un número (sin comillas).`);
        const v = Number(arg.value);
        const min = spec.min ?? 0.000001;
        if (v < min || (spec.min === undefined && v <= 0)) return err(`"${spec.name}" debe ser ${spec.min === undefined ? "mayor que 0" : `al menos ${spec.min}`}.`);
        if (spec.int && !Number.isInteger(v)) return err(`"${spec.name}" debe ser un número entero.`);
        a.v.push(v);
        a.d.push(String(v));
        return;
      }
      if (arg.kind !== "string") return err(`"${spec.name}" de ${fn.name} va entre comillas.`);
      const raw = String(arg.value).trim();
      if (!raw) return err(`"${spec.name}" está vacío.`);
      let v: string | number | null = raw;
      let shown = raw;
      switch (spec.type) {
        case "edition":
          v = resolveEdition(raw, cat);
          if (!v) return err(`No hay una edición "${raw}".`);
          shown = cat.editions.find((e) => e.id === v)!.name;
          break;
        case "product":
          v = resolveProduct(raw, cat);
          if (!v) return err(`No hay un café "${raw}".`);
          shown = cat.products.find((p) => p.id === v)!.name;
          break;
        case "size":
          v = resolveSize(raw, cat);
          if (!v) return err(`No hay una presentación "${raw}".`);
          shown = cat.sizes.find((x) => x.id === v)!.label;
          break;
        case "grind":
          v = resolveGrind(raw);
          if (!v) return err(`Molienda "${raw}": usa Grano entero, Grueso, Medio o Fino.`);
          shown = GRINDS.find((g) => g.id === v)!.name;
          break;
        case "day":
          v = resolveDay(raw);
          if (v === null) return err(`Día "${raw}": usa Lunes, Martes, … Domingo.`);
          shown = DAYS[v as number];
          break;
        case "locale":
          if (!LOCALES.includes(raw.toLowerCase())) return err(`Idioma "${raw}": usa ${LOCALES.join(", ")}.`);
          v = raw.toLowerCase();
          break;
        case "dept":
          v = resolveDept(raw);
          if (!v) return err(`No hay un departamento "${raw}".`);
          shown = v;
          break;
        case "date":
          if (!FECHA.test(raw)) return err(`Fecha "${raw}": usa AAAA-MM-DD o AAAA-MM-DD HH:MM.`);
          if (fn.name === "FECHAS" && raw.length > 10) return err("FECHAS va sin hora; para fechas con hora usa VIGENCIA.");
          break;
        case "time":
          if (!HORA.test(raw)) return err(`Hora "${raw}": usa HH:MM (24 horas).`);
          break;
        case "choice":
          if (!spec.choices?.some((c) => norm(c) === norm(raw))) return err(`Usa ${spec.choices?.map((c) => `"${c}"`).join(" o ")}.`);
          break;
      }
      a.v.push(v);
      a.d.push(shown);
    });
    if (bad) continue;

    /* Reglas que dependen de otros argumentos */
    if (fn.name === "LLEVA_PAGA" && !(n(a, 0) > n(a, 1))) {
      errors.push({ message: "En LLEVA_PAGA, lo que lleva debe ser más que lo que paga (p. ej. 3, 2).", start: node.start, end: node.end });
      continue;
    }
    if (fn.name === "REGALO") {
      const p = cat.products.find((x) => x.id === s(a, 1));
      if (p && p.editionId !== s(a, 0)) {
        errors.push({ message: `"${p.name}" no es de esa edición.`, start: node.args[1].start, end: node.args[1].end });
        continue;
      }
    }
    if (fn.name === "VIGENCIA" && s(a, 0) > s(a, 1)) {
      errors.push({ message: "La fecha de inicio es posterior a la de fin.", start: node.start, end: node.end });
      continue;
    }

    const piece = fn.build(a);
    if (piece.reward) {
      if (reward) {
        errors.push({ message: "Un cupón lleva un solo premio; quita uno de los dos.", start: node.start, end: node.end });
        continue;
      }
      reward = piece.reward;
    }
    if (piece.rules) {
      const { customers, excludeCustomers, requireQty, ...rest } = piece.rules;
      Object.assign(rules, rest);
      if (customers) rules.customers = mergeList(rules.customers, customers);
      if (excludeCustomers) rules.excludeCustomers = mergeList(rules.excludeCustomers, excludeCustomers);
      if (requireQty) rules.requireQty = { ...rules.requireQty, ...requireQty };
    }
    if (piece.options) options = { ...options, ...piece.options };
    lines.push({ cat: fn.cat, text: fn.explain(a) });
  }

  if (!reward && !errors.length)
    errors.push({ message: "Falta el premio: agrega uno, p. ej. PORCENTAJE(10) o ENVIO_GRATIS.", start: root.start, end: root.nameEnd });
  if (rules.wholesale && rules.consumerOnly)
    errors.push({ message: "MAYORISTA y SOLO_BOLETA no pueden ir juntos.", start: root.start, end: root.nameEnd });
  if (rules.onlyCombos && rules.excludeCombos)
    errors.push({ message: "SOLO_COMBOS y SIN_COMBOS no pueden ir juntos.", start: root.start, end: root.nameEnd });

  lines.sort((x, y) => ["Premio", "Regla", "Opción"].indexOf(x.cat) - ["Premio", "Regla", "Opción"].indexOf(y.cat));
  if (errors.length || !reward) return { coupon: null, errors, lines };
  return {
    coupon: {
      code,
      reward,
      ...(Object.keys(rules).length && { rules }),
      active: options.active ?? true,
      ...(options.autoApply && { autoApply: true }),
      ...(options.stackable && { stackable: true }),
      ...(options.exclusive && { exclusive: true }),
      ...(options.aliases?.length && { aliases: options.aliases }),
      ...(options.note && { note: options.note }),
    },
    errors,
    lines,
  };
}

/* ═════════════════════════ Cupón → fórmula ═════════════════════════ */

const q = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** Escribe un cupón como fórmula (para editar los que ya existen) */
export function couponToFormula(c: Coupon, cat: FormulaCatalog): string {
  const ed = (id: string) => q(cat.editions.find((e) => e.id === id)?.name ?? id);
  const pr = (id: string) => q(cat.products.find((p) => p.id === id)?.name ?? id);
  const sz = (id: string) => q(cat.sizes.find((x) => x.id === id)?.label ?? id);
  const gr = (id: string) => q(GRINDS.find((g) => g.id === id)?.name ?? id);
  const call = (name: string, args: (string | number)[] = []) => (args.length ? `${name}(${args.join(", ")})` : name);
  const out: string[] = [];

  const r = c.reward;
  switch (r.type) {
    case "percent": out.push(call("PORCENTAJE", r.maxDiscount ? [r.value, r.maxDiscount] : [r.value])); break;
    case "fixed": out.push(call("MONTO_FIJO", [r.value])); break;
    case "fixedPer": out.push(call("MONTO_POR_CADA", [r.value, r.every])); break;
    case "percentItem":
      out.push(r.value === 100 && r.target === "cheapest" ? "GRATIS_EL_MAS_BARATO" : call("DESCUENTO_EN_UNO", [r.value, q(r.target === "mostExpensive" ? "más cara" : "más barata")]));
      break;
    case "fixedPrice": out.push(call("PRECIO_ESPECIAL", [r.price])); break;
    case "buyXgetY":
      out.push(r.buy === 1 && r.get === 1 && r.discount ? call("SEGUNDO_AL", [r.discount]) : call("LLEVA_PAGA", r.discount ? [r.buy + r.get, r.buy, r.discount] : [r.buy + r.get, r.buy]));
      break;
    case "gift": out.push(call("REGALO", [ed(r.categoryId), pr(r.productId), sz(r.size), gr(r.grind), r.qty ?? 1])); break;
    case "freeShipping": out.push("ENVIO_GRATIS"); break;
    case "shippingDiscount": out.push(call("DESCUENTO_ENVIO", [r.value])); break;
    case "shippingPercent": out.push(call("DESCUENTO_ENVIO_PORCENTAJE", [r.value])); break;
    case "shippingFixed": out.push(call("ENVIO_A", [r.price])); break;
    case "tiered":
      out.push(call(r.by === "amount" ? "ESCALAS_POR_MONTO" : "ESCALAS_POR_CANTIDAD", r.tiers.flatMap((t) => [t.min, t.percent])));
      break;
  }

  const u = c.rules ?? {};
  if (u.minSubtotal) out.push(call("COMPRA_MINIMA", [u.minSubtotal]));
  if (u.maxSubtotal) out.push(call("COMPRA_MAXIMA", [u.maxSubtotal]));
  if (u.minQty) out.push(call("CANTIDAD_MINIMA", [u.minQty]));
  if (u.maxQty) out.push(call("CANTIDAD_MAXIMA", [u.maxQty]));
  if (u.minDistinct) out.push(call("VARIEDAD_MINIMA", [u.minDistinct]));
  if (u.requireProducts?.length) out.push(call("REQUIERE", u.requireProducts.map(pr)));
  for (const [p, qty] of Object.entries(u.requireQty ?? {})) out.push(call("REQUIERE_CANTIDAD", [pr(p), qty]));
  if (u.editions?.length) out.push(call("EDICIONES", u.editions.map(ed)));
  if (u.excludeEditions?.length) out.push(call("EXCEPTO_EDICIONES", u.excludeEditions.map(ed)));
  if (u.products?.length) out.push(call("PRODUCTOS", u.products.map(pr)));
  if (u.excludeProducts?.length) out.push(call("EXCEPTO_PRODUCTOS", u.excludeProducts.map(pr)));
  if (u.sizes?.length) out.push(call("PRESENTACION", u.sizes.map(sz)));
  if (u.grinds?.length) out.push(call("MOLIENDAS", u.grinds.map(gr)));
  if (u.maxDiscountedUnits) out.push(call("LIMITE_UNIDADES", [u.maxDiscountedUnits]));
  if (u.maxDiscount) out.push(call("TOPE_DESCUENTO", [u.maxDiscount]));
  if (u.excludeCombos) out.push("SIN_COMBOS");
  if (u.onlyCombos) out.push("SOLO_COMBOS");
  if (u.firstPurchase) out.push("PRIMERA_COMPRA");
  if (u.minPreviousOrders) out.push(call("CLIENTE_FRECUENTE", [u.minPreviousOrders]));
  if (u.newsletter) out.push("SUSCRIPTORES");
  if (u.wholesale) out.push("MAYORISTA");
  if (u.consumerOnly) out.push("SOLO_BOLETA");
  if (u.customers?.emails?.length) out.push(call("CORREOS", u.customers.emails.map(q)));
  if (u.customers?.domains?.length) out.push(call("DOMINIOS", u.customers.domains.map(q)));
  if (u.customers?.documents?.length) out.push(call("DOCUMENTOS", u.customers.documents.map(q)));
  if (u.excludeCustomers?.emails?.length) out.push(call("EXCEPTO_CORREOS", u.excludeCustomers.emails.map(q)));
  if (u.excludeCustomers?.domains?.length) out.push(call("EXCEPTO_DOMINIOS", u.excludeCustomers.domains.map(q)));
  if (u.excludeCustomers?.documents?.length) out.push(call("EXCEPTO_DOCUMENTOS", u.excludeCustomers.documents.map(q)));
  if (u.locales?.length) out.push(call("IDIOMAS", u.locales.map(q)));
  if (u.paymentMethods?.length === 1) out.push(u.paymentMethods[0] === "card" ? "SOLO_TARJETA" : "SOLO_YAPE");
  if (u.zones?.length === 1) out.push(u.zones[0] === "lima" ? "SOLO_LIMA" : "SOLO_PROVINCIAS");
  if (u.departments?.length) out.push(call("DEPARTAMENTOS", u.departments.map(q)));
  if (u.excludeDepartments?.length) out.push(call("EXCEPTO_DEPARTAMENTOS", u.excludeDepartments.map(q)));
  if (u.validFrom && u.validUntil) out.push(call("VIGENCIA", [q(u.validFrom), q(u.validUntil)]));
  else if (u.validFrom) out.push(call("DESDE", [q(u.validFrom)]));
  else if (u.validUntil) out.push(call("HASTA", [q(u.validUntil)]));
  if (u.daysOfWeek?.length) {
    const d = [...u.daysOfWeek].sort().join(",");
    out.push(d === "0,6" ? "FIN_DE_SEMANA" : call("DIAS", u.daysOfWeek.map((x) => q(DAYS[x] ?? String(x)))));
  }
  if (u.dates?.length) out.push(call("FECHAS", u.dates.map(q)));
  if (u.monthDays?.length) {
    const m = u.monthDays.join(",");
    out.push(m === "15,-1" ? "QUINCENA" : m === "-1" ? "FIN_DE_MES" : call("DIAS_DEL_MES", u.monthDays));
  }
  if (u.hours) out.push(call("HORARIO", [q(u.hours.from), q(u.hours.to)]));
  if (u.maxUses) out.push(call("USOS_MAXIMOS", [u.maxUses]));
  if (u.maxUsesPerCustomer === 1) out.push("UNA_VEZ_POR_CLIENTE");
  else if (u.maxUsesPerCustomer) out.push(call("USOS_POR_CLIENTE", [u.maxUsesPerCustomer]));
  if (u.maxUsesPerDay) out.push(call("USOS_POR_DIA", [u.maxUsesPerDay]));
  if (u.budget) out.push(call("PRESUPUESTO", [u.budget]));

  if (c.autoApply) out.push("AUTOMATICO");
  if (c.stackable) out.push("ACUMULABLE");
  if (c.exclusive) out.push("EXCLUSIVO");
  if (c.active === false) out.push("INACTIVO");
  if (c.aliases?.length) out.push(call("ALIAS", c.aliases.map(q)));
  if (c.note) out.push(call("NOTA", [q(c.note)]));

  return `CUPON(${q(c.code)},\n${out.map((x) => `    ${x}`).join(",\n")}\n)`;
}

/** Ejemplos para empezar */
export const FORMULA_TEMPLATES: { label: string; formula: string }[] = [
  { label: "% en toda la tienda", formula: 'CUPON("VERANO20",\n    PORCENTAJE(20, 40),\n    COMPRA_MINIMA(80),\n    VIGENCIA("2026-12-01", "2026-12-31")\n)' },
  { label: "3x2 en una edición", formula: 'CUPON("MUJERES3X2",\n    LLEVA_PAGA(3, 2),\n    EDICIONES("Edición Mujeres Caficultoras")\n)' },
  { label: "Envío gratis automático", formula: 'CUPON("ENVIOGRATIS",\n    ENVIO_GRATIS,\n    COMPRA_MINIMA(120),\n    AUTOMATICO\n)' },
  { label: "Regalo en 1.ª compra", formula: 'CUPON("BIENVENIDA",\n    REGALO("Edición Clásicos", "Clásico de la Mañana", "250 g", "Grano entero"),\n    PRIMERA_COMPRA,\n    UNA_VEZ_POR_CLIENTE\n)' },
  { label: "Happy hour", formula: 'CUPON("MANANERO",\n    PORCENTAJE(15),\n    HORARIO("06:00", "10:00"),\n    DIAS("Lunes", "Martes", "Miércoles", "Jueves", "Viernes")\n)' },
];
