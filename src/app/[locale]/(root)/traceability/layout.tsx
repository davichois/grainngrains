import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata, metaText } from "@/src/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return pageMetadata({
    locale,
    path: "/traceability",
    title: t("traceability.title"),
    description: metaText(t("traceability.subtitle")),
  });
}

export default function TraceabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
