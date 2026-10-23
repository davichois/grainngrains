import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** La trazabilidad ahora vive en Forestland Sentinel (igual que
 *  TRACEABILITY_URL en src/lib/site.ts) */
const TRACEABILITY_URL = "https://forestlandsentinel.grainngrains.org";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.68.51"],
  /* La antigua página /traceability (y sus códigos) ya no existe: los
     enlaces viejos y lo que esté en buscadores van a Forestland Sentinel */
  async redirects() {
    return [
      {
        source: "/traceability/:path*",
        destination: TRACEABILITY_URL,
        permanent: true,
      },
      {
        source: "/:locale(en|es|de|fr|pt|zh|ja|ko)/traceability/:path*",
        destination: TRACEABILITY_URL,
        permanent: true,
      },
    ];
  },
  images: {
    // Sirve AVIF/WebP automáticamente (mucho más ligero que PNG/JPG)
    formats: ["image/avif", "image/webp"],
    // Calidades permitidas (Next 16 solo deja 75 si no se indican):
    // 90 para fotos de producto, 95 para logos y sellos
    qualities: [75, 90, 95],
    // Cachea las imágenes optimizadas más tiempo
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "lirp.cdn-website.com",
      },
      /* Fotos subidas desde el panel (n8n → Google Drive) */
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
