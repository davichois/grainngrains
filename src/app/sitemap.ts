import type { MetadataRoute } from "next";
import { routing } from "@/src/i18n/routing";
import { ROUTES, absUrl, localizedPath } from "@/src/lib/site";
import { LEGAL_LOCALES } from "@/src/content/legal";
import { LEGAL_PATHS } from "@/src/lib/legal-metadata";

/**
 * Sitemap multilingüe: una entrada por idioma de cada ruta, con enlaces
 * recíprocos hreflang (incluido x-default) según recomienda Google.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  /* Páginas legales: solo existen en español e inglés */
  const legal = Object.values(LEGAL_PATHS).flatMap((path) => {
    const languages: Record<string, string> = Object.fromEntries(
      LEGAL_LOCALES.map((l) => [l, absUrl(localizedPath(l, path))]),
    );
    languages["x-default"] = absUrl(localizedPath("en", path));
    return LEGAL_LOCALES.map((locale) => ({
      url: absUrl(localizedPath(locale, path)),
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.3,
      alternates: { languages },
    }));
  });

  const pages = ROUTES.flatMap((path) => {
    const languages: Record<string, string> = {};
    for (const l of routing.locales) {
      languages[l] = absUrl(localizedPath(l, path));
    }
    languages["x-default"] = absUrl(
      localizedPath(routing.defaultLocale, path),
    );

    const isHome = path === "";

    return routing.locales.map((locale) => ({
      url: absUrl(localizedPath(locale, path)),
      lastModified,
      changeFrequency: isHome ? ("weekly" as const) : ("monthly" as const),
      priority: isHome ? 1 : 0.7,
      alternates: { languages },
    }));
  });

  return [...pages, ...legal];
}
