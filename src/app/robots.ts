import type { MetadataRoute } from "next";
import { absUrl } from "@/src/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* Solo las APIs internas. /_next/ NO se bloquea: de ahí salen el CSS,
         el JavaScript y las imágenes optimizadas, y Google los necesita
         para ver la página como un visitante (y mostrar las imágenes) */
      disallow: ["/api/", "/admin"],
    },
    sitemap: absUrl("/sitemap.xml"),
    host: absUrl(""),
  };
}
