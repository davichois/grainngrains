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
    path: "/about/global-footprint",
    title: t("seo.globalFootprint"),
    description: metaText(
      t.markup("globalFootprint.hero.description", {
        strong: (chunks) => chunks,
        trace: (chunks) => chunks,
      }),
    ),
  });
}

export default function GlobalFootprintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
