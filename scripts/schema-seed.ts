/* ───────────────────────────────────────────────────────────────
   Genera los datos iniciales del catálogo para supabase/schema.sql
   (ediciones, cafés, combos, cupones y ajustes) a partir del código, y
   los escribe entre las marcas "catálogo inicial" del archivo.
     npm run schema:seed
   Todo va con "on conflict do nothing": volver a ejecutar el schema no
   pisa lo que se haya editado en el panel.
─────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from "node:fs";
import { CATEGORIES, COMBOS } from "../src/components/product-showcase/data";
import { COUPONS } from "../src/lib/coupons/data";
import { DEFAULT_SHOP_SETTINGS } from "../src/lib/shop";
import { DEFAULT_CONTACT, DEFAULT_PROMO } from "../src/lib/site";

const FILE = "supabase/schema.sql";
const START = "-- >>> catálogo inicial (generado con: npm run schema:seed) >>>";
const END = "-- <<< catálogo inicial <<<";

const q = (v: string | null | undefined) => (v == null ? "null" : `'${v.replace(/'/g, "''")}'`);
const j = (v: unknown) => (v == null ? "null" : `${q(JSON.stringify(v))}::jsonb`);
const insert = (table: string, cols: string[], rows: string[][], conflict: string) =>
  rows.length
    ? `insert into ${table} (${cols.join(", ")}) values\n${rows.map((r) => `  (${r.join(", ")})`).join(",\n")}\non conflict (${conflict}) do nothing;\n`
    : "";

const editions = insert(
  "editions",
  ["id", "custom", "active", "color", "panel_bg", "panel_image", "hero_text_color", "heading_color", "sort"],
  CATEGORIES.map((c, i) => [q(c.id), "false", "true", q(c.color), q(c.panelBg), q(c.panelImage), q(c.heroTextColor), q(c.headingColor), String(i * 10)]),
  "id",
);

const products = insert(
  "products",
  ["id", "category_id", "custom", "active", "prices", "image", "hover_image", "card_bg", "certifications", "sort"],
  CATEGORIES.flatMap((c) =>
    c.products.map((p, i) => [q(p.id), q(c.id), "false", "true", j(p.prices), q(p.image), q(p.hoverImage), q(p.cardBg), j(p.certifications), String(i * 10)]),
  ),
  "id",
);

const combos = insert(
  "combos",
  ["id", "custom", "active", "discount", "items", "sort"],
  COMBOS.map((c, i) => [q(c.id), "false", "true", String(c.discount), j(c.items.map((x) => ({ ...x, size: x.size ?? "250g" }))), String(i * 10)]),
  "id",
);

const coupons = insert(
  "coupons",
  ["code", "data"],
  COUPONS.map((c) => [q(c.code), j(c)]),
  "code",
);

const settings = insert(
  "settings",
  ["key", "value"],
  [
    [q("shop"), j(DEFAULT_SHOP_SETTINGS)],
    [q("contact"), j(DEFAULT_CONTACT)],
    [q("promo"), j(DEFAULT_PROMO)],
    [q("sizes"), j([])],
  ],
  "key",
);

const block = `${START}
-- Lo mismo que trae el código de la web, para que la base empiece completa.
-- Los nombres y descripciones siguen en messages/*.json (se editan en el
-- panel y se guardan en i18n_overrides).

-- Ediciones (${CATEGORIES.length})
${editions}
-- Cafés (${CATEGORIES.reduce((n, c) => n + c.products.length, 0)}) · stock sin límite hasta que se ponga en el panel
${products}
-- Combos (${COMBOS.length})
${combos}
-- Cupones (${COUPONS.length})
${coupons}
-- Ajustes: envíos, contacto, modal de promoción y presentaciones extra
${settings}${END}`;

const sql = readFileSync(FILE, "utf8");
const out = sql.includes(START)
  ? sql.slice(0, sql.indexOf(START)) + block + sql.slice(sql.indexOf(END) + END.length)
  : `${sql.trimEnd()}\n\n${block}\n`;
writeFileSync(FILE, out);
console.log(
  `schema.sql actualizado: ${CATEGORIES.length} ediciones, ${CATEGORIES.reduce((n, c) => n + c.products.length, 0)} cafés, ${COMBOS.length} combos, ${COUPONS.length} cupones, 4 ajustes`,
);
