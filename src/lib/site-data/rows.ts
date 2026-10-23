import type { CertificationId } from "@/src/components/product-showcase/types";
import type { ComboOverride, EditionOverride, ProductOverride } from "./apply";

/* Filas de Supabase (snake_case) de productos y ediciones, y su forma en
   los datos de la web (ver apply.ts) */

export type ProductRow = {
  id: string;
  category_id: string;
  custom: boolean;
  active: boolean;
  deleted: boolean;
  prices: ProductOverride["prices"];
  stock: ProductOverride["stock"];
  sold_out: boolean | null;
  sold_out_sizes: string[] | null;
  image: string | null;
  hover_image: string | null;
  card_bg: string | null;
  certifications: CertificationId[] | null;
  sort: number | null;
};

/** Varietal o proceso de la lista (tablas varietals / processes) */
export type OptionRow = { id: string; active: boolean; sort: number | null };

/** Varietal o proceso que tiene un café (product_varietals / product_processes) */
export type ProductVarietalRow = { product_id: string; varietal_id: string; active: boolean; sold_out: boolean | null; sort: number | null };
export type ProductProcessRow = { product_id: string; process_id: string; active: boolean; sold_out: boolean | null; sort: number | null };

export type EditionRow = {
  id: string;
  custom: boolean;
  active: boolean;
  deleted: boolean;
  color: string | null;
  panel_bg: string | null;
  panel_image: string | null;
  hero_text_color: string | null;
  heading_color: string | null;
  sort: number | null;
};

export const toProduct = (r: ProductRow): ProductOverride => ({
  id: r.id,
  categoryId: r.category_id,
  custom: r.custom,
  active: r.active,
  deleted: r.deleted,
  prices: r.prices,
  stock: r.stock,
  soldOut: Boolean(r.sold_out),
  soldOutSizes: r.sold_out_sizes ?? [],
  image: r.image,
  hoverImage: r.hover_image,
  cardBg: r.card_bg,
  certifications: r.certifications,
  sort: r.sort,
});

export const toEdition = (r: EditionRow): EditionOverride => ({
  id: r.id,
  custom: r.custom,
  active: r.active,
  deleted: r.deleted,
  color: r.color,
  panelBg: r.panel_bg,
  panelImage: r.panel_image,
  heroTextColor: r.hero_text_color,
  headingColor: r.heading_color,
  sort: r.sort,
});

export type ComboRow = {
  id: string;
  custom: boolean;
  active: boolean;
  deleted: boolean;
  discount: number | null;
  items: ComboOverride["items"];
  sort: number | null;
};

export const toCombo = (r: ComboRow): ComboOverride => ({
  id: r.id,
  custom: r.custom,
  active: r.active,
  deleted: r.deleted,
  discount: r.discount == null ? null : Number(r.discount),
  items: r.items,
  sort: r.sort,
});
