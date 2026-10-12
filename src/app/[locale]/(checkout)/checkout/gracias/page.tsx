import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, Mail, Truck } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { pageMetadata } from "@/src/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "thanks" });
  return pageMetadata({
    locale,
    path: "/checkout/gracias",
    title: t("title"),
    description: t("text"),
    noIndex: true,
  });
}

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string }>;
}) {
  const { pedido } = await searchParams;
  const t = await getTranslations("thanks");
  const orderNumber = pedido?.slice(0, 40);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center font-ui">
      <CheckCircle2
        size={64}
        strokeWidth={1.5}
        aria-hidden
        className="mb-6 text-[#116e78]"
      />
      <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
      <p className="mt-3 text-gray-600">{t("text")}</p>

      {orderNumber && (
        <p className="mt-6 rounded-xl bg-[#f7f6f3] px-5 py-3 text-sm text-gray-700">
          {t("orderLabel")}{" "}
          <strong className="font-semibold text-gray-900">{orderNumber}</strong>
        </p>
      )}

      <ul className="mt-8 space-y-3 text-left text-sm text-gray-600">
        <li className="flex items-start gap-3">
          <Mail
            size={18}
            aria-hidden
            className="mt-0.5 shrink-0 text-[#116e78]"
          />
          {t("emailNote")}
        </li>
        <li className="flex items-start gap-3">
          <Truck
            size={18}
            aria-hidden
            className="mt-0.5 shrink-0 text-[#116e78]"
          />
          {t("shippingNote")}
        </li>
      </ul>

      <Link
        href="/our-coffee/products"
        className="mt-10 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#116e78]"
      >
        {t("back")}
      </Link>
    </main>
  );
}
