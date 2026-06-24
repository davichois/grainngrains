import type { MetadataRoute } from "next";
import { routing } from "@/src/i18n/routing";
import { ROUTES, absUrl, localizedPath } from "@/src/lib/site";

/**
 * Sitemap multilingüe: una entrada por idioma de cada ruta, con enlaces
 * recíprocos hreflang (incluido x-default) según recomienda Google.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.flatMap((path) => {
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
}
