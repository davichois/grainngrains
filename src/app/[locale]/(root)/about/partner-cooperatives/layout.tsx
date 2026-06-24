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
  const title = `${t("partner.headingTop")} ${t("partner.headingBottom")}`;
  return pageMetadata({
    locale,
    path: "/about/partner-cooperatives",
    title,
    description: metaText(t("partner.heroDescription")),
  });
}

export default function PartnerCooperativesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
