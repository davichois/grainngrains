import type { Metadata } from "next";
import { futura, jost, montserrat } from "@/src/lib/fonts";
import "../globals.css";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/src/i18n/routing";
import SiteDataProvider from "@/src/components/SiteDataProvider";
import { ensureSiteData } from "@/src/lib/site-data/load";
import { getMessages, getTranslations } from "next-intl/server";
import {
  SITE_URL,
  BRAND,
  SITE_KEYWORDS,
  OG_LOCALE,
  absUrl,
  localizedPath,
  metaText,
} from "@/src/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const description = metaText(
    t.markup("motto", { trace: (chunks) => chunks }),
  );

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${BRAND.name} — Specialty Green Coffee, Traceable from Origin`,
      template: `%s | ${BRAND.name}`,
    },
    description,
    applicationName: BRAND.name,
    keywords: SITE_KEYWORDS,
    authors: [{ name: BRAND.name, url: SITE_URL }],
    creator: BRAND.name,
    publisher: BRAND.name,
    category: "Food & Beverage",
    formatDetection: { email: false, address: false, telephone: false },
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      title: `${BRAND.name} — ${BRAND.slogan}`,
      description,
      url: absUrl(localizedPath(locale, "")),
      locale: OG_LOCALE[locale] ?? "en_US",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: BRAND.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${BRAND.name} — ${BRAND.slogan}`,
      description,
      images: ["/og-image.png"],
    },
    /* Indexar y seguir enlaces es lo normal (no hace falta decirlo): así
       las páginas que no se indexan (404, noIndex) no reciben dos órdenes
       contradictorias */
    robots: {
      googleBot: {
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    manifest: "/manifest.webmanifest",
    alternates: {
      languages: Object.fromEntries(
        routing.locales
          .map((l) => [l, absUrl(localizedPath(l, ""))])
          .concat([
            ["x-default", absUrl(localizedPath(routing.defaultLocale, ""))],
          ]),
      ),
    },
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? {
          verification: {
            google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
          },
        }
      : {}),
  };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  const messages = await getMessages();

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale });
  /* Datos del panel: se aplican aquí (servidor) y en el navegador */
  const siteData = await ensureSiteData();

  // Datos estructurados (JSON-LD) para que Google entienda la marca y sus
  // variantes de nombre (Grain & Grains, grain and grains, grainngrains, G&G).
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: BRAND.name,
        legalName: BRAND.legalName,
        alternateName: BRAND.alternateNames,
        url: SITE_URL,
        logo: absUrl("/icon-512.png"),
        image: absUrl("/og-image.png"),
        email: BRAND.email,
        slogan: BRAND.slogan,
        description: metaText(t.markup("motto", { trace: (chunks) => chunks })),
        sameAs: BRAND.social,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: BRAND.name,
        alternateName: BRAND.alternateNames,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: routing.locales,
      },
    ],
  };

  return (
    <html lang={locale} className={montserrat.variable}>
      <body
        className={`${futura.variable} ${jost.variable}`}
        style={{
          fontFamily: `${futura.style.fontFamily}, ${jost.style.fontFamily}, Arial, sans-serif`,
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          {/* Datos del panel (catálogo, cupones, envíos, contacto…) */}
          <SiteDataProvider data={siteData}>{children}</SiteDataProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
