import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Reveal from "@/src/components/Reveal";
import { StaggerContainer, Item } from "@/src/components/motion/Motion";

export default async function CertificationsSection() {
  const t = await getTranslations("certifications");

  const certifications = [
    {
      name: "Fair Trade",
      url: "/certificates/fairtrade-international.svg",
      logo: "/certificates/fairtrade-international.svg",
    },
    {
      name: "Clean Cup Alliance",
      url: "/certificates/cleancupalliance.webp",
      logo: "/certificates/cleancupalliance.webp",
    },
    {
      name: "USDA Organic",
      url: "/certificates/USDA_organic.webp",
      logo: "/certificates/USDA_organic.webp",
    },
  ];
  const cooperativas = [
    {
      name: "CAFCER",
      url: "https://cafcer.com/",
      logo: "/cafcer1.webp",
    },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-[#377aa7] px-6 py-20 md:px-12 lg:px-20">
      {/* Banner de fondo */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/certifications/banner.svg"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#377aa7]/80" />
      </div>

      <StaggerContainer className="relative z-10 mx-auto max-w-4xl text-center">
        <Item>
          <h2
            className="font-black uppercase leading-[0.95] tracking-tight text-[#8dbe22]"
            style={{ fontSize: "clamp(2.25rem, 7vw, 4.5rem)" }}
          >
            {t("heading")}
          </h2>
        </Item>

        <Item>
          <p className="mx-auto mt-6 max-w-2xl text-md leading-relaxed md:text-lg text-[#8dbe22]">
            {t("description")}
          </p>
        </Item>
      </StaggerContainer>

      {/* Tarjeta principal: logos + claim */}
      <div className="relative z-10 mx-auto mt-12 grid max-w-5xl grid-cols-1 items-center gap-8 p-8 md:grid-cols-2 md:p-12 lg:p-16">
        {/* Logos */}
        <StaggerContainer className="grid grid-cols-3 gap-6 sm:gap-8" stagger={0.12}>
          {certifications.map((cert) => (
            <Item key={cert.name} className="flex items-center justify-center">
              <Image
                src={cert.logo}
                alt={cert.name}
                width={160}
                height={80}
                className="object-contain w-auto h-20 sm:h-24 transition-transform duration-300 hover:scale-110"
                quality={95}
              />
            </Item>
          ))}
        </StaggerContainer>

        {/* Claim */}
        <Reveal direction="right">
          <h3
            className="font-black uppercase leading-[0.95] tracking-tight md:text-right text-[#8dbe22]"
            style={{ fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)" }}
          >
            {t("claim")}
          </h3>
        </Reveal>
      </div>

      <div className="relative z-10 mx-auto mt-12 grid max-w-5xl grid-cols-1 items-center gap-8 p-8 md:grid-cols-2 md:p-12 lg:p-16">
        {/* Claim */}
        <Reveal direction="left">
          <h3
            className="font-black uppercase leading-[0.95] tracking-tight md:text-right text-[#8dbe22]"
            style={{ fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)" }}
          >
            {t("cooperatives")}
          </h3>
        </Reveal>
        {/* Logos */}
        <StaggerContainer className="grid grid-cols-3 gap-6 sm:gap-8" stagger={0.12}>
          {cooperativas.map((coop) => (
            <Item key={coop.name} className="flex items-center justify-center">
              <a
                href={coop.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={coop.name}
                className="flex items-center justify-center transition hover:scale-105"
              >
                <Image
                  src={coop.logo}
                  alt={coop.name}
                  width={180}
                  height={80}
                  className="object-contain w-auto h-26 sm:h-26"
                  quality={95}
                />
              </a>
            </Item>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
