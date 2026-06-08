import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "de", "fr", "pt", "zh", "ja", "ko"],
  defaultLocale: "en",
  localePrefix: "always",
});
