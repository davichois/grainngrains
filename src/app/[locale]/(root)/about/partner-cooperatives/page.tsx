"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Sprout, Leaf, TreePine, Coffee, Mountain, Sun } from "lucide-react";
import PartnerInfographic from "@/src/components/PartnerInfographic";
import {
  ScrollProgress,
  StaggerContainer,
  Item,
  Parallax,
} from "@/src/components/motion/Motion";

// Icono representativo por sección (se muestra solo en móvil)
const icons = [Sprout, Leaf, TreePine, Coffee, Mountain, Sun];

import partner01 from "@/public/images/partner/partner01.webp";
import partner02 from "@/public/images/partner/partner02.webp";
import partner03 from "@/public/images/partner/partner03.webp";
import partner04 from "@/public/images/partner/partner04.webp";
import partner05 from "@/public/images/partner/partner05.webp";
import Image from "next/image";

const bgImages = [partner01, partner02, partner03, partner04, partner05];

const colors = [
  "bg-[#255156]",
  "bg-[#38837c]",
  "bg-[#173d50]",
  "bg-[#1F474C]",
  "bg-[#274A52]",
  "bg-[#2D5B4E]",
];

export default function PartnerCooperatives() {
  const t = useTranslations("partner");
  const sections = t.raw("sections") as Array<{
    number: string;
    title: string;
    text: string;
  }>;

  const [active, setActive] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const setSectionRef = (index: number) => (el: HTMLElement | null) => {
    if (el) {
      sectionRefs.current[index] = el;
      el.dataset.index = String(index);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            setActive(index);
          }
        });
      },
      { threshold: 0.6 },
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const activeEl = itemRefs.current[active];
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [active]);

  return (
    <div className="overflow-x-hidden bg-white mt-20 md:mt-24 lg:mt-30">
      <ScrollProgress color="#abb500" />

      {/* Cabecera / Hero */}
      <section className="relative w-full h-[60vh] min-h-110 lg:h-[75vh] overflow-hidden">
        <Parallax amount={70} className="absolute inset-0 scale-110">
          <Image
            src="/images/partner/partner.jpg"
            alt="Alianza Grain & Grains y CAFCER"
            fill
            priority
            className="object-cover"
          />
        </Parallax>

        {/* Degradado para legibilidad */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 #abb500/45 #abb500/30" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <StaggerContainer className="flex flex-col items-center" once={false}>
            <Item direction="down">
              <span className="mb-4 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#ffffff] sm:text-xl">
                {t("eyebrow")}
              </span>
            </Item>

            <Item>
              <h1 className="font-black uppercase leading-[0.85] tracking-tight text-[clamp(3.5rem,15vw,11rem)] drop-shadow-lg">
                CAFCER
              </h1>
            </Item>

            <Item>
              <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-white/85 sm:text-lg md:text-xl">
                {t("heroDescription")}
              </p>
            </Item>
          </StaggerContainer>
        </div>
      </section>

      <PartnerInfographic />

      <section className="bg-[#255156] py-10 px-6">
        <StaggerContainer className="max-w-5xl mx-auto text-center" once={false}>
          <h2 className="uppercase text-[#abb500]">
            <Item>
              <span className="block font-light tracking-wide text-[clamp(1.4rem,3vw,3.75rem)]">
                {t("headingTop")}
              </span>
            </Item>

            <Item>
              <span className="block font-black leading-[0.85] tracking-tight text-[clamp(2.5rem,8vw,6rem)] md:text-[clamp(4rem,10vw,8rem)]">
                {t("headingBottom")}
              </span>
            </Item>
          </h2>
        </StaggerContainer>
      </section>

      {sections.map((section, i) => (
        <section
          key={i}
          ref={setSectionRef(i)}
          className={`relative text-cyan-950 flex items-end justify-center px-6 py-16 md:py-20 md:min-h-screen lg:items-center ${colors[i]}`}
        >
          {/* Imagen de fondo: oculta en móvil, visible desde iPad */}
          {bgImages[i] && (
            <div
              className="hidden md:block absolute inset-0 bg-cover bg-center lg:bg-fixed"
              style={{ backgroundImage: `url(${bgImages[i].src})` }}
            />
          )}

          <div className="relative z-10 w-full lg:pr-12 xl:pr-20">
            {/* Texto: centrado/abajo en móvil e iPad, a la derecha en desktop */}
            <StaggerContainer
              className="mx-auto max-w-xl text-center lg:mr-0 lg:ml-auto lg:text-right"
              once={false}
            >
              {/* Icono representativo (solo móvil) */}
              {(() => {
                const Icon = icons[i % icons.length];
                return (
                  <Item>
                    <Icon
                      size={56}
                      strokeWidth={1.5}
                      className="mx-auto mb-5 text-[#A4B742] md:hidden"
                    />
                  </Item>
                );
              })()}

              <Item direction={i % 2 === 0 ? "left" : "right"}>
                <h3 className="font-futura font-bold text-[#A4B742] text-[clamp(3rem,5vw,5rem)] leading-[0.95] uppercase">
                  {section.title}
                </h3>
              </Item>

              <Item direction={i % 2 === 0 ? "left" : "right"}>
                <p className="mt-4 text-[#A4B742] leading-relaxed text-[clamp(1.05rem,1.6vw,1.5rem)]">
                  {section.text}
                </p>
              </Item>
            </StaggerContainer>
          </div>
        </section>
      ))}
    </div>
  );
}
