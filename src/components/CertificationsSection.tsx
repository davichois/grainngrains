import Image from "next/image";
import { getTranslations } from "next-intl/server";

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
      url: "/certificates/cleancupalliance.png",
      logo: "/certificates/cleancupalliance.png",
    },
    {
      name: "USDA Organic",
      url: "/certificates/USDA_organic.png",
      logo: "/certificates/USDA_organic.png",
    },
  ];
  const cooperativas = [
    {
      name: "CAFCER",
      url: "https://cafcer.com/",
      logo: "/cafcer.png",
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

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2
          className="font-black uppercase leading-[0.95] tracking-tight text-[#8dbe22]"
          style={{ fontSize: "clamp(2.25rem, 7vw, 4.5rem)" }}
        >
          {t("heading")}
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-md leading-relaxed md:text-lg text-[#8dbe22]">
          {t("description")}
        </p>
      </div>

      {/* Tarjeta principal: logos + claim */}
      <div className="relative z-10 mx-auto mt-12 grid max-w-5xl grid-cols-1 items-center gap-8 p-8 md:grid-cols-2 md:p-12 lg:p-16">
        {/* Logos */}
        <div className="grid grid-cols-3 gap-6 sm:gap-8">
          {certifications.map((cert) => (
            <Image
              key={cert.name}
              src={cert.logo}
              alt={cert.name}
              width={160}
              height={80}
              className="object-contain w-auto h-20 sm:h-24"
              quality={95}
            />
          ))}
        </div>

        {/* Claim */}
        <h3
          className="font-black uppercase leading-[0.95] tracking-tight md:text-right text-[#8dbe22]"
          style={{ fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)" }}
        >
          {t("claim")}
        </h3>
      </div>

      <div className="relative z-10 mx-auto mt-12 grid max-w-5xl grid-cols-1 items-center gap-8 p-8 md:grid-cols-2 md:p-12 lg:p-16">
        {/* Claim */}
        <h3
          className="font-black uppercase leading-[0.95] tracking-tight md:text-right text-[#8dbe22]"
          style={{ fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)" }}
        >
          {t("cooperatives")}
        </h3>
        {/* Logos */}
        <div className="grid grid-cols-3 gap-6 sm:gap-8">
          {cooperativas.map((coop) => (
            <a
              key={coop.name}
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
          ))}
        </div>
      </div>
    </section>
  );
}
