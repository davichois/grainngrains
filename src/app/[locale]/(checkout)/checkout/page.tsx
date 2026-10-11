import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CheckoutForm from "@/src/components/checkout/CheckoutForm";
import { pageMetadata } from "@/src/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return pageMetadata({
    locale,
    path: "/checkout",
    title: t("checkout.title"),
    description: t("checkout.secure"),
    /* Página personal de cada cliente: no se indexa */
    noIndex: true,
  });
}

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");
  return (
    <main>
      <h1 className="sr-only">{t("title")}</h1>
      <CheckoutForm />
    </main>
  );
}
