import type { Metadata } from "next";
import { Link } from "@/src/i18n/navigation";
import { getTranslations } from "next-intl/server";
import CertificationsSection from "../../../components/CertificationsSection";
import Reveal from "@/src/components/Reveal";
import {
  ScrollProgress,
  StaggerContainer,
  Item,
} from "@/src/components/motion/Motion";
import { metaText, buildAlternates, absUrl, localizedPath } from "@/src/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const description = metaText(t("motto"));
  return {
    description,
    alternates: buildAlternates(locale, ""),
    openGraph: { url: absUrl(localizedPath(locale, "")), description },
  };
}

export default async function Home() {
  const t = await getTranslations();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <ScrollProgress color="#F63049" />

      <Reveal className="relative block w-full overflow-hidden text-white">
        <Link href="/our-coffee/products" className="block cursor-pointer">
          <video
            className="pointer-events-none block w-full h-auto object-cover mt-30"
            poster="/videos/intro-poster.jpg"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            controls={false}
            disablePictureInPicture
            aria-hidden="true"
          >
            <source src="/videos/intro.webm" type="video/webm" />
            <source src="/videos/intro.mp4" type="video/mp4" />
          </video>
        </Link>
      </Reveal>
      <section className="flex min-h-[50svh] md:min-h-[60svh] lg:min-h-[70vh] w-full items-center justify-center bg-[#F63049] px-6 py-12 md:px-10 md:py-16 lg:py-24">
        <StaggerContainer
          className="mx-auto max-w-7xl text-center"
          once={false}
        >
          <Item>
            <h2 className="uppercase leading-[0.82]">
              <span
                className="block font-light tracking-tight text-[#FFE054]"
                style={{
                  fontSize: "clamp(1.75rem, 5vw, 5.5rem)",
                }}
              >
                {t("home.sections.0.title")}
              </span>

              <span
                className="block font-black tracking-[-0.03em] text-[#FFE054]"
                style={{
                  fontSize: "clamp(3rem, 10vw, 8.75rem)",
                }}
              >
                {t("home.sections.0.subtitle")}
              </span>
            </h2>
          </Item>

          <Item>
            <p className="mx-auto mt-6 max-w-xs text-sm leading-[1.4] text-[#FFE054] sm:max-w-lg sm:text-base md:mt-8 md:max-w-2xl lg:mt-10 lg:max-w-3xl lg:text-lg">
              {t("home.sections.0.description")}
            </p>
          </Item>

          <Item>
            <Link
              href="/sustainability"
              className="inline-block mt-8 text-amber-50 border-2 border-amber-50 px-6 py-2 text-sm font-semibold uppercase tracking-wide transition-all duration-300 ease-out will-change-transform hover:scale-105 active:scale-95 hover:bg-[#F63049] hover:text-[#FFE054] hover:border-[#FFE054] focus:outline-none focus:ring-2 focus:ring-[#F63049] focus:ring-offset-2 md:mt-12 md:px-8 md:py-2 md:text-base lg:mt-16 lg:px-10 lg:py-3 lg:text-lg"
            >
              {t("home.readMore")}
            </Link>
          </Item>
        </StaggerContainer>
      </section>
      <section className="flex min-h-[50svh] md:min-h-[60svh] lg:min-h-[70vh] w-full items-center justify-center bg-[#a4bf2e] px-6 py-12 md:px-10 md:py-16 lg:py-24">
        <StaggerContainer
          className="mx-auto max-w-7xl text-center"
          once={false}
        >
          <Item>
            <h2 className="uppercase leading-[0.82]">
              <span
                className="block font-light tracking-tight text-[#982332]"
                style={{
                  fontSize: "clamp(1.75rem, 5vw, 5.5rem)",
                }}
              >
                {t("home.meetPartner")}
              </span>

              <span
                className="block font-black tracking-[-0.03em] text-[#982332]"
                style={{
                  fontSize: "clamp(3rem, 10vw, 8.75rem)",
                }}
              >
                CAFCER
              </span>
            </h2>
          </Item>

          <Item>
            <p className="mx-auto mt-6 max-w-xs text-sm leading-[1.4] text-[#982332] sm:max-w-lg sm:text-base md:mt-8 md:max-w-2xl lg:mt-10 lg:max-w-3xl lg:text-lg">
              {t("partner.heroDescription")}
            </p>
          </Item>

          <Item>
            <Link
              href="/about/partner-cooperatives"
              className="inline-block mt-8 text-[#982332] border-2 border-[#982332] px-6 py-2 text-sm font-semibold uppercase tracking-wide transition-all duration-300 ease-out will-change-transform hover:scale-105 active:scale-95 hover:bg-[#b1d21c] hover:text-[#982332] hover:border-[#982332] focus:outline-none focus:ring-2 focus:ring-[#982332] focus:ring-offset-2 md:mt-12 md:px-8 md:py-2 md:text-base lg:mt-16 lg:px-10 lg:py-3 lg:text-lg"
            >
              {t("home.readMore")}
            </Link>
          </Item>
        </StaggerContainer>
      </section>
      <section className="flex  items-center justify-center bg-[#00b8db] w-full py-20">
        <StaggerContainer
          className="mx-auto max-w-5xl text-center"
          once={false}
        >
          <Item>
            <p className="mb-4 text-lg md:text-2xl font-light tracking-wide text-sky-700 uppercase">
              {t("home.sections.1.title")}
            </p>
          </Item>

          <Item>
            <h2 className="font-black uppercase leading-[0.9] tracking-tight text-sky-950 text-[clamp(3.5rem,10vw,8rem)]">
              {t("home.sections.1.subtitle")}
            </h2>
          </Item>

          <Item>
            <p className="mx-auto mt-8 max-w-3xl text-lg md:text-2xl leading-relaxed text-sky-800">
              {t("home.sections.1.description")}
            </p>
          </Item>

          <Item>
            <Link
              href="/about"
              className="inline-block mt-8 text-amber-50 border-2 border-amber-50 px-6 py-2 text-sm font-semibold uppercase tracking-wide transition-all duration-300 ease-out will-change-transform hover:scale-105 active:scale-95 hover:text-cyan-800 hover:border-cyan-900 focus:outline-none focus:ring-2 focus:ring-[#F63049] focus:ring-offset-2 md:mt-12 md:px-8 md:py-2 md:text-base lg:mt-16 lg:px-10 lg:py-3 lg:text-lg"
            >
              {t("home.knowMore")}
            </Link>
          </Item>
        </StaggerContainer>
      </section>
      <CertificationsSection />
    </div>
  );
}
