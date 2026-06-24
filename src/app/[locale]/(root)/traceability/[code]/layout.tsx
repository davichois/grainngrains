import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata, metaText } from "@/src/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale, code } = await params;
  const t = await getTranslations({ locale });
  // Cada lote es contenido único y efímero: lo dejamos fuera del índice
  // para evitar páginas delgadas/duplicadas, pero seguible por enlaces.
  return pageMetadata({
    locale,
    path: `/traceability/${code}`,
    title: `${t("traceability.title")} · ${code}`,
    description: metaText(t("traceability.subtitle")),
    noIndex: true,
  });
}

export default function TraceabilityCodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
