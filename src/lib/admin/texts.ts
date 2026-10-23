import "server-only";
import { routing } from "@/src/i18n/routing";
import { listTextOverrides, settingsView } from "./queries";
import { canTranslate } from "./translate";

/* Nombres de producto por idioma: el texto original (messages/*.json) y el
   editado en el panel (tabla i18n_overrides) */

/** Idiomas de la web, con el español primero (es el obligatorio) */
export const LOCALES = [
  "es",
  ...routing.locales.filter((l) => l !== "es"),
] as const;

export const LOCALE_NAMES: Record<string, string> = {
  es: "Español",
  en: "Inglés",
  de: "Alemán",
  fr: "Francés",
  pt: "Portugués",
  zh: "Chino",
  ja: "Japonés",
  ko: "Coreano",
};

async function baseMessages(locale: string): Promise<Record<string, unknown>> {
  return (await import(`../../../messages/${locale}.json`)).default;
}

/** Texto original de una clave ("a.b.c") en un idioma */
export async function baseText(locale: string, key: string) {
  let node: unknown = await baseMessages(locale);
  for (const p of key.split(".")) {
    if (node && typeof node === "object") node = (node as Record<string, unknown>)[p];
    else return "";
  }
  return typeof node === "string" ? node : "";
}

/**
 * Texto actual de una clave en cada idioma (editado o el original).
 * `fallbackKey`: de dónde sale el original si la clave no existe en el
 * código (un café del código que se movió a otra edición).
 */
export async function textsFor(key: string, fallbackKey?: string) {
  const overrides = await listTextOverrides();
  const out: Record<string, { value: string; base: string; edited: boolean }> = {};
  for (const l of LOCALES) {
    const base = (await baseText(l, key)) || (fallbackKey ? await baseText(l, fallbackKey) : "");
    const o = overrides.find((r) => r.locale === l && r.key === key);
    out[l] = { value: o?.value ?? base, base, edited: Boolean(o) };
  }
  return out;
}

/** Cómo se traducen los textos del panel (Ajustes → Traducción) */
export async function translationConfig() {
  const { translation } = await settingsView();
  return {
    manual: translation.manual === true,
    canTranslate: canTranslate(),
    locales: LOCALES.map((l) => ({ id: l, name: LOCALE_NAMES[l] })),
  };
}
