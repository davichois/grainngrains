import type { MetadataRoute } from "next";
import { absUrl } from "@/src/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Evita indexar las APIs internas de optimización de imágenes de Next.
      disallow: ["/api/", "/_next/"],
    },
    sitemap: absUrl("/sitemap.xml"),
    host: absUrl(""),
  };
}
