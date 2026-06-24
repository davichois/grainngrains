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
    path: "/about",
    title: "Our History",
    description: metaText(t("history.intro2")),
  });
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
