import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Reveal from "@/src/components/Reveal";
import Floating from "@/src/components/Floating";
import {
  ScrollProgress,
  StaggerContainer,
  Item,
  Parallax,
  Tilt,
} from "@/src/components/motion/Motion";

// Correo del encargado para solicitar acceso (tercer bloque)
const MANAGER_EMAIL = "tradingna@grainngrains.org";

// Solo estilos/recursos; los textos vienen de las traducciones (messages/*.json)
const blockStyles: {
  image: string;
  bg: string;
  border: string;
  text: string;
  link?: string;
  restricted?: boolean;
}[] = [
  {
    image: "/images/sustainability/cleancupalliance.svg",
    bg: "bg-[#FEFDDF]",
    border: "bg-[#FEFDDF]",
    text: "text-[#25343F]",
    link: "https://clean-cup-alliance.vercel.app/", // TODO: URL real de Clean Cup Alliance
  },
  {
    image: "/images/sustainability/flowerwheels.svg",
    bg: "bg-[#c4d74a]",
    border: "bg-[#FEFDDF]",
    text: "text-[#25343F]",
    link: "https://flavorwheel.grainngrains.org/es", // TODO: URL real de la Rueda de Sabores
  },
  {
    image: "/images/sustainability/FLS.svg",
    bg: "bg-[#FFB200]",
    border: "bg-[#ff9d00]",
    text: "text-[#25343F]",
    restricted: true, // Acceso bajo solicitud al encargado
  },
];

export default async function Sustainability() {
  const t = await getTranslations("sustainability");

  return (
    <div className="bg-white text-cyan-950 overflow-x-hidden w-full mt-20 md:mt-24 lg:mt-30">
      <ScrollProgress color="#FFB200" />

      {/* Cabecera / Hero */}
      <section className="relative w-full h-[55vh] min-h-90 lg:h-[80vh] overflow-hidden">
        <Parallax amount={70} className="absolute inset-0 scale-125">
          <Image
            src="/images/sustainability/monito.png"
            alt={t("hero.title")}
            fill
            priority
            className="object-cover"
          />
        </Parallax>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <Reveal direction="down" delay={100}>
            <p className="mb-4 text-sm tracking-[0.2em] uppercase sm:text-base">
              <span className="font-bold">{t("hero.tagTech")}</span>
              <span className="font-light">
                {" "}
                | {t("hero.tagSustainability")}
              </span>{" "}
              <span className="font-bold">| {t("hero.tagBiodiversity")}</span>
            </p>
          </Reveal>
          <Reveal direction="up" delay={200}>
            <h1 className="font-black uppercase leading-none tracking-tight text-[clamp(3rem,12vw,9rem)]">
              {t("hero.title")}
            </h1>
          </Reveal>
          <Reveal direction="up" delay={400}>
            <p className="mt-4 max-w-2xl text-base font-light sm:text-lg md:text-xl">
              {t("hero.subtitle")}
            </p>
          </Reveal>
        </div>
      </section>

      {blockStyles.map((style, index) => {
        // Patrón de lados: derecha → izquierda → derecha...
        const imageOnRight = index % 2 === 0;
        const title = t(`blocks.${index}.title`);
        const imageAlt = t(`blocks.${index}.imageAlt`);

        return (
          <section
            key={title}
            className={`relative w-full overflow-hidden border-y-2 border-[#25343F] ${style.bg}`}
          >
            <div className="mx-auto w-full max-w-8xl">
              <div className="group grid md:grid-cols-2 md:min-h-[55vh] lg:min-h-[70vh]">
                {/* Imagen (tablet / desktop) */}
                <Reveal
                  direction={imageOnRight ? "right" : "left"}
                  className={`relative hidden md:block ${
                    imageOnRight ? "md:order-2" : "md:order-1"
                  }`}
                >
                  <Floating className="absolute inset-0" duration={5 + index}>
                    <Tilt className="h-full w-full">
                      <Image
                        src={style.image}
                        alt={imageAlt}
                        fill
                        className="object-contain p-8 md:p-20 lg:p-40 xl:p-30"
                      />
                    </Tilt>
                  </Floating>
                </Reveal>

                {/* Contenido */}
                <div
                  className={`relative flex items-center justify-center px-6 py-12 sm:px-8 sm:py-16 md:px-10 md:py-14 lg:px-16 lg:py-20 xl:px-20 ${
                    imageOnRight ? "md:order-1" : "md:order-2"
                  }`}
                >
                  <StaggerContainer
                    className={`w-full max-w-md md:max-w-lg lg:max-w-md ${style.text}`}
                  >
                    <Item direction={imageOnRight ? "left" : "right"}>
                      <p className="mb-3 text-base font-light tracking-wide sm:text-lg lg:mb-4 lg:text-xl">
                        {t(`blocks.${index}.eyebrow`)}
                      </p>
                    </Item>

                    <Item direction={imageOnRight ? "left" : "right"}>
                      <h2 className="mb-5 inline-block text-3xl font-bold uppercase tracking-tight after:mt-2 after:block after:h-1 after:w-0 after:bg-current after:transition-all after:duration-700 group-hover:after:w-full sm:text-4xl md:text-3xl lg:mb-6 lg:text-5xl">
                        {title}
                      </h2>
                    </Item>

                    {/* Imagen (solo móvil) */}
                    <Item>
                      <div className="mb-6 flex justify-center md:hidden">
                        <Image
                          src={style.image}
                          alt={imageAlt}
                          width={420}
                          height={300}
                          className="h-auto w-full max-w-xs object-contain transition-transform duration-500 ease-out hover:scale-105 sm:max-w-sm"
                        />
                      </div>
                    </Item>

                    <Item direction={imageOnRight ? "left" : "right"}>
                      <p className="text-base leading-relaxed sm:text-lg">
                        {t(`blocks.${index}.description`)}
                      </p>
                    </Item>

                    {/* CTA: botón de redirección o aviso de acceso restringido */}
                    <Item>
                      {style.restricted ? (
                        <div className="mt-6">
                          <p className="mb-3 text-sm font-medium sm:text-base">
                            {t("requestAccess")}
                          </p>
                          <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                              MANAGER_EMAIL,
                            )}&su=${encodeURIComponent(
                              `${title} — ${t("requestAccess")}`,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/btn inline-flex items-center justify-center gap-2 border-2 border-[#25343F] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-[#25343F] transition-all duration-200 hover:bg-[#25343F] hover:text-white hover:shadow-lg hover:-translate-y-0.5"
                          >
                            {t("contact")}
                            <span className="transition-transform duration-200 group-hover/btn:translate-x-1">
                              →
                            </span>
                          </a>
                        </div>
                      ) : (
                        <a
                          href={style.link ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/btn mt-6 inline-flex items-center justify-center gap-2 border-2 border-[#25343F] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-[#25343F] transition-all duration-200 hover:bg-[#25343F] hover:text-white hover:shadow-lg hover:-translate-y-0.5"
                        >
                          {t("learnMore")}
                          <span className="transition-transform duration-200 group-hover/btn:translate-x-1">
                            →
                          </span>
                        </a>
                      )}
                    </Item>
                  </StaggerContainer>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
