import { Caveat } from "next/font/google";

import { Breadcrumb } from "@/src/components/Breadcrumb";
import Faqs from "@/src/components/Faqs";
import OurPromise from "@/src/components/supply-chain-excellence/OurPromise";
import { StaggerContainer, Item, Tilt } from "@/src/components/motion/Motion";
import { useTranslations } from "next-intl";
import {
  Truck,
  ArrowRight,
  Bean,
  Sprout,
  QrCode,
  Flame,
  PackageCheck,
  Award,
} from "lucide-react";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
});
const ICON_CLS = "w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 shrink-0";
const STROKE = 1.25;

const steps = [
  {
    id: 1,
    label: "Bean",
    icon: <Bean className={ICON_CLS} strokeWidth={STROKE} />,
  },
  {
    id: 2,
    label: "Sprout",
    icon: <Sprout className={ICON_CLS} strokeWidth={STROKE} />,
  },
  {
    id: 3,
    label: "Flame",
    icon: <Flame className={ICON_CLS} strokeWidth={STROKE} />,
  },
  {
    id: 4,
    label: "Award",
    icon: <Award className={ICON_CLS} strokeWidth={STROKE} />,
  },
  {
    id: 5,
    label: "PackageCheck",
    icon: <PackageCheck className={ICON_CLS} strokeWidth={STROKE} />,
  },
  {
    id: 6,
    label: "Truck",
    icon: <Truck className={ICON_CLS} strokeWidth={STROKE} />,
  },
  {
    id: 7,
    label: "QrCode",
    icon: <QrCode className={ICON_CLS} strokeWidth={STROKE} />,
  },
];

type HeroSectionProps = {
  title: string;
  subtitle: string;
  description: string;
};

function HeroSection({ title, subtitle, description }: HeroSectionProps) {
  return (
    <section className="px-5 sm:px-8 md:px-12 xl:px-20 pt-2 pb-8 xl:pt-10 xl:pb-10">
      <StaggerContainer className="max-w-6xl mx-auto flex flex-col gap-8 xl:gap-5 items-center text-center">
        <Item className="flex-1 min-w-0">
          <h1 className="text-4xl sm:text-4xl md:text-6xl xl:text-[4.6rem] font-black tracking-tight leading-tight whitespace-pre-line text-neutral-900">
            {title}
          </h1>
        </Item>
        <Item>
          <span
            className={`-rotate-5 px-15 py-1 text-xl text-neutral-900 font-medium ${caveat.className}`}
          >
            {subtitle}
          </span>
        </Item>
        <Item className="flex-1 min-w-0 xl:pt-5">
          <p className="text-base md:text-lg xl:text-xl leading-relaxed text-cyan-950">
            {description}
          </p>
        </Item>
      </StaggerContainer>
    </section>
  );
}

export default function SupplyChainExcellence() {
  const t = useTranslations();

  const faqs = [
    {
      id: 4,
      question: t("faqs.faqs4.question"),
      answer: t("faqs.faqs4.answer"),
    },
    {
      id: 5,
      question: t("faqs.faqs5.question"),
      answer: t("faqs.faqs5.answer"),
    },
    {
      id: 6,
      question: t("faqs.faqs6.question"),
      answer: t("faqs.faqs6.answer"),
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
      <HeroSection
        title={t("supply-chain-excellence.hero.title")}
        subtitle={t("supply-chain-excellence.hero.subtitle")}
        description={t("supply-chain-excellence.hero.description")}
      />
      <section className="w-full px-6 py-10 sm:py-4 lg:py-6 ">
        {/* Icons row */}
        <StaggerContainer
          className="flex flex-wrap items-center justify-center gap-y-6"
          stagger={0.1}
        >
          {steps.map((step, i) => (
            <Item key={step.id} className="flex items-center">
              <Tilt className="text-cyan-900 cursor-pointer" >
                <div aria-label={step.label}>{step.icon}</div>
              </Tilt>

              {i < steps.length - 1 && (
                <ArrowRight
                  className="
                  w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9
                  text-cyan-800 mx-2 sm:mx-3 lg:mx-5 shrink-0
                "
                  strokeWidth={2}
                  aria-hidden="true"
                />
              )}
            </Item>
          ))}
        </StaggerContainer>
      </section>
      <OurPromise />
      <Faqs faqs={faqs} />
    </main>
  );
}
