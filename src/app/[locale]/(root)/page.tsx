import type { Metadata } from "next";
import { Link } from "@/src/i18n/navigation";
import { getTranslations } from "next-intl/server";
import CertificationsSection from "../../../components/CertificationsSection";
import OriginHero from "@/src/components/origin-hero/OriginHero";
import {
  ScrollProgress,
  StaggerContainer,
  Item,
} from "@/src/components/motion/Motion";
import { metaText, pageMetadata } from "@/src/lib/site";

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
  return pageMetadata({
    locale,
    path: "",
    title: t("seo.homeTitle"),
    description,
  });
}

export default async function Home() {
  const t = await getTranslations();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <ScrollProgress color="#F63049" />
      {/* Título principal de la página (para buscadores y lectores de
          pantalla) */}
      <h1 className="sr-only">{t("seo.homeHeading")}</h1>

      {/* Portada: las latas pasando sobre "Descubre el verdadero origen…" */}
      <Link
        href="/our-coffee/products"
        aria-label={t("nav.ourCollection")}
        className="mt-30 block w-full cursor-pointer"
      >
        <OriginHero />
      </Link>
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

              {/* Crece con la pantalla pero sin salirse: la palabra más larga
                  ("BIODIVERSIDAD", "BIODIVERSIDADE"…) mide ~9,3 veces el tamaño
                  de letra, así que se limita al ancho disponible */}
              <span
                className="block font-black tracking-[-0.03em] text-[#FFE054]"
                style={{
                  fontSize: "clamp(1.75rem, calc(10.2vw - 6px), 8.75rem)",
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
              <span className="sr-only">: {t("nav.sustainability")}</span>
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
              <span className="sr-only">: {t("nav.meetPartner")}</span>
            </Link>
          </Item>
        </StaggerContainer>
      </section>
      <section className="flex items-center justify-center bg-[#00b8db] w-full px-6 py-20 md:px-10">
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
            {/* Se adapta al ancho y corta con guion las palabras muy largas
                (p. ej. "FAMILIENUNTERNEHMEN" en alemán) para no salirse */}
            <h2 className="font-black uppercase leading-[0.9] tracking-tight text-sky-950 text-[clamp(2rem,10vw,8rem)] hyphens-auto wrap-break-word">
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
              <span className="sr-only">: {t("nav.ggHistory")} G&G</span>
            </Link>
          </Item>
        </StaggerContainer>
      </section>
      <CertificationsSection />
    </div>
  );
}
