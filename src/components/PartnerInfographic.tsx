"use client";

import Lottie from "lottie-react";
import { useTranslations } from "next-intl";
import mapAnimation from "@/public/images/partner/el-cacao-map-2.json";
import Reveal from "@/src/components/Reveal";
import { StaggerContainer, Item } from "@/src/components/motion/Motion";

const MAROON = "#982332";

// Valores e íconos (no se traducen); las etiquetas vienen de messages/partner.infographic
const values = ["810", "1,125", "17", "450", "11%"];
const statIcons = [
  "/images/partner/icons/bag.svg",
  "/images/partner/icons/trees.svg",
  "/images/partner/icons/tree.svg",
  "/images/partner/icons/bee.svg",
  "/images/partner/icons/hand.svg",
];

export default function PartnerInfographic() {
  const t = useTranslations("partner");
  const intro = t("infographic.intro");
  const labels = t.raw("infographic.stats") as Array<{
    pre?: string;
    label: string;
    sub?: string;
  }>;
  const stats = labels.map((l, i) => ({
    ...l,
    value: values[i],
    icon: statIcons[i],
  }));

  return (
    <section className="relative w-full overflow-hidden bg-[#A4BF2E] px-2 py-16 md:px-10 md:py-20 lg:px-16">
      {/* Mapa como fondo (solo desktop) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] items-center lg:flex">
        <Lottie
          animationData={mapAnimation}
          loop
          autoplay
          className="w-full"
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Mapa (solo móvil / tablet) */}
        <div className="mx-auto w-full max-w-xl lg:hidden">
          <Lottie animationData={mapAnimation} loop autoplay />
        </div>

        {/* Contenido: en desktop ocupa la columna derecha */}
        <div className="lg:col-start-2" style={{ color: MAROON }}>
          <Reveal direction="right" once={false}>
            <p className="mx-auto w-full text-center text-base leading-relaxed sm:text-lg lg:mx-0 lg:text-right">
              {intro}
            </p>
          </Reveal>

          {/* Estadísticas */}
          <StaggerContainer
            className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3"
            stagger={0.1}
            once={false}
          >
            {stats.map((s, i) => (
              <Item key={i} className="flex flex-col items-center text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.icon}
                  alt=""
                  aria-hidden="true"
                  className="mb-3 h-14 w-auto sm:h-16"
                />
                {s.pre && <span className="text-xs sm:text-sm">{s.pre}</span>}
                <span className="font-futura text-4xl font-bold leading-none sm:text-5xl">
                  {s.value}
                </span>
                <span className="mt-2 text-xs font-bold uppercase leading-tight sm:text-sm">
                  {s.label}
                </span>
                {s.sub && (
                  <span className="text-xs font-light uppercase leading-tight sm:text-sm">
                    {s.sub}
                  </span>
                )}
              </Item>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
