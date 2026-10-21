import type { Metadata } from "next";
import LegalPage from "@/src/components/legal/LegalPage";
import { legalMetadata } from "@/src/lib/legal-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return legalMetadata(locale, "terms");
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LegalPage locale={locale} id="terms" />;
}
