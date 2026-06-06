import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "de", "fr", "pt", "zh", "ja"],
  defaultLocale: "en",
  localePrefix: "always",
});
