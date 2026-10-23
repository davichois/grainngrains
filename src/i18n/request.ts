import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import {
  loadTextOverrides,
  mergeTextOverrides,
} from "@/src/lib/site-data/load";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  /* Textos del idioma + los editados desde el panel */
  const [base, overrides] = await Promise.all([
    import(`../../messages/${locale}.json`).then((m) => m.default),
    loadTextOverrides(locale),
  ]);
  return { locale, messages: mergeTextOverrides(base, overrides) };
});
