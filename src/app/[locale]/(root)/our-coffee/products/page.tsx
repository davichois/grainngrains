import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductShowcase } from "@/src/components/product-showcase";
import {
  CATEGORIES,
  CERTIFICATIONS,
} from "@/src/components/product-showcase/data";
import { BRAND, SITE_URL, pageMetadata, metaText } from "@/src/lib/site";
import { SIZES } from "@/src/lib/shop";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return pageMetadata({
    locale,
    path: "/our-coffee/products",
    title: t("nav.ourCollection"),
    description: metaText(t.markup("motto", { trace: (chunks) => chunks })),
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const pageUrl = `${SITE_URL}/${locale}/our-coffee/products`;

  /* Datos estructurados: la colección como lista de productos con precio
     en soles y certificaciones, para que los buscadores la entiendan */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("nav.ourCollection"),
    url: pageUrl,
    itemListElement: CATEGORIES.flatMap((c) =>
      c.products.map((p) => ({ c, p })),
    ).map(({ c, p }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: t(`editions.${c.id}.products.${p.id}`),
        category: t(`editions.${c.id}.name`),
        description: metaText(t(`editions.${c.id}.subtitle`)),
        ...(p.image && { image: `${SITE_URL}${p.image}` }),
        brand: { "@type": "Brand", name: BRAND.name },
        hasCertification: p.certifications.map((id) => ({
          "@type": "Certification",
          name: CERTIFICATIONS[id].name,
        })),
        /* Una oferta por presentación (250 g, 1 kg) */
        offers: SIZES.map((size) => ({
          "@type": "Offer",
          name: t(`shop.sizes.${size}`),
          price: p.prices[size].toFixed(2),
          priceCurrency: "PEN",
          availability: "https://schema.org/InStock",
          url: pageUrl,
        })),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Título principal de la página (el slider lo muestra de forma visual) */}
      <h1 className="sr-only">
        {t("nav.ourCollection")} · {BRAND.name}
      </h1>
      {/* El encabezado queda siempre a la vista (126 px): el slider empieza
          justo debajo */}
      <div className="pt-[7.875rem]">
        <ProductShowcase />
      </div>
    </>
  );
}
