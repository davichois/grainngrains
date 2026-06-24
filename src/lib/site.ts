import type { Metadata } from "next";
import { routing } from "@/src/i18n/routing";

/**
 * Configuración central de SEO / marca.
 * El dominio se puede sobreescribir con la variable de entorno
 * NEXT_PUBLIC_SITE_URL (sin barra final). Por defecto usa el dominio
 * derivado del correo corporativo (tradingna@grainngrains.org).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://grainngrains.org"
).replace(/\/$/, "");

export const BRAND = {
  /** Nombre canónico de la marca. */
  name: "Grain & Grains",
  /** Variaciones de nombre con las que la gente busca la marca (para SEO). */
  alternateNames: [
    "Grain and Grains",
    "Grainngrains",
    "grain & grains",
    "grain and grains",
    "grainngrains",
    "Grain&Grains",
    "G&G",
    "Grain & Grains Coffee",
  ],
  legalName: "Grain & Grains",
  email: "tradingna@grainngrains.org",
  /** Slogan de marca. */
  slogan: "From Farm to Future",
  social: [
    "https://www.instagram.com/grainngrains",
    "https://www.linkedin.com/company/grain-grains-coffee",
    "https://www.facebook.com/profile.php?id=61584672518944",
  ],
} as const;

/** Palabras clave base de la marca/sector (es/en) para la metadata. */
export const SITE_KEYWORDS = [
  "Grain & Grains",
  "Grain and Grains",
  "grainngrains",
  "G&G",
  "specialty coffee",
  "café de especialidad",
  "green coffee",
  "café verde",
  "coffee traceability",
  "trazabilidad del café",
  "sustainable coffee",
  "café sostenible",
  "coffee exporter",
  "exportador de café",
  "single origin coffee",
  "from farm to future",
];

/** Mapea cada locale de la app al código BCP-47 que usa Open Graph. */
export const OG_LOCALE: Record<string, string> = {
  en: "en_US",
  es: "es_ES",
  de: "de_DE",
  fr: "fr_FR",
  pt: "pt_PT",
  zh: "zh_CN",
  ja: "ja_JP",
  ko: "ko_KR",
};

/** Rutas públicas (sin prefijo de idioma) que deben indexarse. */
export const ROUTES: string[] = [
  "",
  "/our-coffee/products",
  "/about",
  "/about/global-footprint",
  "/about/supply-chain-excellence",
  "/about/partner-cooperatives",
  "/sustainability",
  "/shop",
  "/traceability",
];

/**
 * Limpia una cadena de traducción para usarla como meta description:
 * elimina etiquetas (p. ej. <strong> del rich text), colapsa espacios y
 * la trunca a ~160 caracteres.
 */
export function metaText(text: string, max = 160): string {
  const clean = text
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Construye la ruta con prefijo de idioma: ("en","/about") -> "/en/about". */
export function localizedPath(locale: string, path = ""): string {
  return `/${locale}${path}`;
}

/** URL absoluta a partir de una ruta relativa. */
export function absUrl(path = ""): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Genera el bloque `alternates` (canonical + hreflang) para una ruta dada,
 * incluyendo x-default apuntando al idioma por defecto.
 */
export function buildAlternates(locale: string, path = "") {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = absUrl(localizedPath(l, path));
  }
  languages["x-default"] = absUrl(localizedPath(routing.defaultLocale, path));
  return {
    canonical: absUrl(localizedPath(locale, path)),
    languages,
  };
}

/**
 * Helper para la metadata de cada página: arma title, description, canonical,
 * hreflang y Open Graph/Twitter coherentes con la ruta y el idioma.
 */
export function pageMetadata(opts: {
  locale: string;
  path?: string;
  title: string;
  description: string;
  /** Si true, evita indexación (p. ej. páginas dinámicas de trazabilidad). */
  noIndex?: boolean;
  images?: string[];
}): Metadata {
  const { locale, path = "", title, description, noIndex, images } = opts;
  const url = absUrl(localizedPath(locale, path));
  const ogImages = (images ?? ["/og-image.png"]).map((src) =>
    src.startsWith("http") ? src : absUrl(src),
  );

  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    ...(noIndex
      ? { robots: { index: false, follow: true } }
      : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: BRAND.name,
      locale: OG_LOCALE[locale] ?? "en_US",
      type: "website",
      images: ogImages.map((u) => ({
        url: u,
        width: 1200,
        height: 630,
        alt: BRAND.name,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages,
    },
  };
}
