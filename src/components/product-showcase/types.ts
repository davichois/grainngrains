import type { ProductOption, SizeId } from "@/src/lib/shop";

/* Tipos del módulo Product Showcase (slider + grilla de productos)
   Los textos (nombre, subtítulo, bigTop/bigBot, nombre de producto) viven en
   los archivos de /messages bajo el namespace `editions`. Aquí solo guardamos
   identificadores y datos no traducibles (colores, imágenes, etc.).
   Claves i18n usadas:
     editions.bigTop
     editions.<category.id>.{name, bigBot, subtitle}
     editions.<category.id>.products.<product.id>
*/

export type CategoryColor = string;

/** Certificaciones disponibles (ver CERTIFICATIONS en data.ts) */
export type CertificationId = "fairtrade" | "usdaOrganic" | "cleanCup";

export interface Certification {
  /** Nombre oficial del sello (no se traduce) */
  name: string;
  /** Logo del sello, relativo a /public */
  logo: string;
}

export interface ShowcaseProduct {
  /** Identificador i18n del producto: editions.<cat>.products.<id> */
  id: string;
  /** Precio en soles (S/) por presentación (ver SIZES en src/lib/shop.ts) */
  prices: Record<SizeId, number>;
  /** Sellos que tiene este café; se muestran arriba de la tarjeta, en este orden */
  certifications: CertificationId[];
  /** Gradiente CSS de respaldo cuando no hay imagen */
  bg: string;
  /** Color sólido de fondo de la tarjeta (si se omite usa el color de la categoría) */
  cardBg?: string;
  /** Imagen frontal opcional (foto real del producto) */
  image?: string;
  /** Imagen de hover opcional */
  hoverImage?: string;
  /** Unidades disponibles por presentación (desde el panel). Sin dato o
   *  null = sin límite */
  stock?: Partial<Record<SizeId, number | null>>;
  /** Varietales que el cliente puede elegir (con su recargo) */
  varietals?: ProductOption[];
  /** Procesos que el cliente puede elegir (con su recargo) */
  processes?: ProductOption[];
}

export interface ShowcaseCategory {
  /** Identificador i18n de la edición: editions.<id> */
  id: string;
  color: CategoryColor;
  /** Fondo (color) del panel del slider */
  panelBg: string;
  /** Imagen de fondo opcional del panel del slider; si se omite usa `panelBg` */
  panelImage?: string;
  /** Cómo encaja la imagen del hero: "cover" (recorta) o "contain" (sin recortar). Default "cover" */
  panelImageFit?: "cover" | "contain";
  /** Posición/recorte de la imagen del hero (CSS object-position). Ej: "center top". Default "center" */
  panelImagePosition?: string;
  /** Calidad de la imagen del hero (1-100). Default 90 */
  panelImageQuality?: number;
  /** Color de las letras "sorpresa" (bigTop/bigBot) del slider; por defecto #f5e68a */
  heroTextColor?: string;
  /** Color del texto del encabezado dinámico (nombre + subtítulo); por defecto #FFF0B4 */
  headingColor?: string;
  products: ShowcaseProduct[];
}

/** Combo de cafés: se vende como un solo producto con descuento */
export interface ShowcaseCombo {
  /** Identificador i18n: cart.combos.<id>.name */
  id: string;
  /** Descuento en % sobre la suma de los precios de sus cafés */
  discount: number;
  /** Cafés incluidos (una unidad de cada uno), cada uno en su presentación
   *  (sin `size` = 250 g, ver COMBO_SIZE) */
  items: { categoryId: string; productId: string; size?: SizeId }[];
}
