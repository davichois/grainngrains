import type { Metadata } from "next";
import { LEGAL_LOCALES, legalDoc, type LegalDocId } from "@/src/content/legal";
import { absUrl, localizedPath, pageMetadata } from "@/src/lib/site";

export const LEGAL_PATHS: Record<LegalDocId, string> = {
  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookies",
};

/**
 * Metadata de las páginas legales. Solo existen en español e inglés: los
 * otros idiomas muestran el inglés con noindex (para no duplicar contenido)
 * y apuntan su canonical a la versión en inglés.
 */
export function legalMetadata(locale: string, id: LegalDocId): Metadata {
  const path = LEGAL_PATHS[id];
  const { doc, lang } = legalDoc(locale, id);
  const base = pageMetadata({
    locale,
    path,
    title: doc.title,
    description: doc.description,
    noIndex: lang !== locale,
  });
  const languages: Record<string, string> = Object.fromEntries(
    LEGAL_LOCALES.map((l) => [l, absUrl(localizedPath(l, path))]),
  );
  languages["x-default"] = absUrl(localizedPath("en", path));
  return {
    ...base,
    alternates: {
      canonical: absUrl(localizedPath(lang, path)),
      languages,
    },
  };
}
