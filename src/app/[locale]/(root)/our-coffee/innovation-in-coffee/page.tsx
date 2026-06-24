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
  // Página aún en construcción: indexable=false hasta que tenga contenido real.
  return pageMetadata({
    locale,
    path: "/our-coffee/innovation-in-coffee",
    title: t("nav.coffeeInnovation"),
    description: metaText(t("motto")),
    noIndex: true,
  });
}

export default function InnovationInCoffee() {
  return (
    <div className="bg-white text-cyan-950 overflow-x-hidden h-screen flex items-center justify-center">
      <h1>Innovación en el Café</h1>
    </div>
  );
}
