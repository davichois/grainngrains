"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import { Breadcrumb } from "@/src/components/Breadcrumb";
import StatsSection from "@/src/components/StatsSection";
import huellaglobal from "@/public/images/about/huellaglobal.png";
import Faqs from "@/src/components/Faqs";

const richTextTags = {
  strong: (chunks: React.ReactNode) => (
    <strong className="text-neutral-900 font-semibold">{chunks}</strong>
  ),
};

function PrimaryBtn({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        inline-flex items-center justify-center rounded-full
        bg-cyan-800 text-white font-semibold
        text-base md:text-lg px-12 py-3 md:py-3.5
        border border-cyan-800
        hover:bg-white hover:text-cyan-800
        transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500
      "
    >
      {children}
    </Link>
  );
}

function HeroSection() {
  const t = useTranslations("globalFootprint.hero");
  return (
    <section className="px-5 sm:px-8 md:px-12 xl:px-20 pt-12 pb-8 xl:pt-20 xl:pb-12">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-8 xl:gap-20 items-start">
        <div className="flex-1 min-w-0">
          <span
            className="block w-14 md:w-20 h-px md:h-1 mb-3 md:mb-5 shrink-0 bg-cyan-800"
            aria-hidden
          />
          <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-[4rem] font-black tracking-tight text-neutral-900 leading-tight whitespace-pre-line">
            {t("title")}
          </h1>
        </div>
        <div className="flex-1 min-w-0 xl:pt-5">
          <p className="text-base md:text-lg xl:text-xl leading-relaxed text-neutral-700">
            {t.rich("description", richTextTags)}
          </p>
        </div>
      </div>
    </section>
  );
}

function FootprintSection() {
  const t = useTranslations("globalFootprint.footprint");
  return (
    <section className="px-5 sm:px-8 md:px-12 xl:px-20 py-12 lg:py-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 xl:gap-24 items-center">
        <div className="w-full lg:w-1/2 border border-neutral-300 p-4 md:p-8 lg:p-10 shrink-0">
          <Image
            src={huellaglobal}
            alt={t("heading")}
            width={800}
            height={800}
            className="w-full h-auto"
          />
        </div>
        <div className="w-full lg:w-1/2">
          <span
            className="block w-14 md:w-20 h-px md:h-1 mb-3 md:mb-5 shrink-0 bg-cyan-800"
            aria-hidden
          />
          <h3 className="text-2xl sm:text-3xl md:text-6xl font-extrabold tracking-tight text-neutral-900 mb-6">
            {t("heading")}
          </h3>
          {/* paragraph1 contains {strong}...{/strong} rich text */}
          <p className="text-base md:text-lg leading-relaxed text-neutral-700 mb-4">
            {t.rich("paragraph1", richTextTags)}
          </p>
          {/* paragraph2 is plain text */}
          <p className="text-base md:text-lg leading-relaxed text-neutral-700 mb-10">
            {t("paragraph2")}
          </p>
          <PrimaryBtn href="/about/supply-chain-excellence">
            {t("cta")}
          </PrimaryBtn>
        </div>
      </div>
    </section>
  );
}

export default function GlobalFootprint() {
  const t = useTranslations();
  const faqs = [
    {
      id: 1,
      question: t("faqs.faqs1.question"),
      answer: t("faqs.faqs1.answer"),
    },
    {
      id: 2,
      question: t("faqs.faqs2.question"),
      answer: t("faqs.faqs2.answer"),
    },
    {
      id: 3,
      question: t("faqs.faqs3.question"),
      answer: t("faqs.faqs3.answer"),
    },
  ];

  return (
    <main className="min-h-screen antialiased bg-white">
      <div className="h-28"></div>
      <Breadcrumb
        hideSegments={["es", "en", "de", "fr", "it", "pt", "zh", "ja", "ko"]}
        labels={{
          "": "Home",
          sustainability: "Sustainability",
          "supply-chain-excellence": "Supply Chain Excellence",
        }}
      />
      <HeroSection />

      <StatsSection
        heading={t("globalFootprint.stats.heading")}
        stats={[
          {
            value: t("globalFootprint.stats.stat0value"),
            suffix: "+",
            label: t("globalFootprint.stats.stat0label"),
            hex: "#e87837",
          },
          {
            value: t("globalFootprint.stats.stat1value"),
            label: t("globalFootprint.stats.stat1label"),
            hex: "#048677",
          },
          {
            value: t("globalFootprint.stats.stat2value"),
            suffix: "+",
            label: t("globalFootprint.stats.stat2label"),
            hex: "#ad3232",
          },
        ]}
      />
      <FootprintSection />
      <Faqs faqs={faqs} />
      {/* <TabSectionComponent tabs={tabs} /> */}
    </main>
  );
}
