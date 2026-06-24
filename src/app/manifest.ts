import type { MetadataRoute } from "next";
import { BRAND } from "@/src/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — ${BRAND.slogan}`,
    short_name: BRAND.name,
    description:
      "Connecting exceptional coffee farms to the world — quality, traceability, and sustainability from origin to cup.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#116e78",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
