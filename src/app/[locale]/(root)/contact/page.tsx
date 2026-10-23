import type { Metadata } from "next";
import { ensureSiteData } from "@/src/lib/site-data/load";
import { getTranslations } from "next-intl/server";
import { Mail, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import ContactForm from "@/src/components/contact/ContactForm";
import { INQUIRY_TYPES, type InquiryType } from "@/src/lib/contact";
import { CONTACT, pageMetadata, whatsappUrl } from "@/src/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return pageMetadata({
    locale,
    path: "/contact",
    title: t("meta.title"),
    description: t("meta.description"),
  });
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  /* Catálogo y contacto con los datos del panel */
  await ensureSiteData();
  const { locale } = await params;
  const { tipo } = await searchParams;
  const t = await getTranslations({ locale, namespace: "contact" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  /* /contact?tipo=greenQuote abre directo la cotización */
  const initialType = INQUIRY_TYPES.includes(tipo as InquiryType)
    ? (tipo as InquiryType)
    : "general";

  /* Canales directos: botones cuadrados como "LEER MÁS" */
  const channels = [
    {
      icon: FaWhatsapp,
      label: t("channels.whatsapp"),
      href: whatsappUrl(t("whatsappMessage")),
      external: true,
    },
    { icon: Phone, label: CONTACT.phone, href: CONTACT.phoneHref },
    { icon: Mail, label: CONTACT.email, href: `mailto:${CONTACT.email}` },
  ];

  return (
    <main>
      {/* Una sola vista: bloque teal con el título a la izquierda y el
          formulario a la derecha (en celular, uno debajo del otro) */}
      <section className="relative isolate overflow-hidden bg-white px-6 pb-16 pt-36 sm:px-10 lg:flex lg:min-h-svh lg:items-center lg:pb-10 lg:pt-32 xl:px-16">
        {/* Palabra gigante de fondo, en gris casi blanco */}
        <span
          aria-hidden
          className="soft-fade pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-[42%] select-none whitespace-nowrap text-center font-black uppercase leading-[0.78] tracking-[-0.04em] text-[#F2F2F2]"
          style={{
            fontSize: "clamp(5rem, 19vw, 21rem)",
            animationDuration: "1.6s",
            animationDelay: "0.3s",
          }}
        >
          {tNav("contact")}
        </span>
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
          {/* Título y canales */}
          <div className="min-w-0 text-center lg:text-left">
            <h1 className="uppercase leading-[0.85] text-[#1E1E1E]">
              <span
                className="soft-in block font-light tracking-tight text-[#787878]"
                style={{ fontSize: "clamp(1.4rem, 2.8vw, 2.6rem)" }}
              >
                {t("kicker")}
              </span>
              <span
                /* Interlineado algo más abierto: deja sitio a las tildes (CAFÉ) */
                className="soft-in mt-2 block font-black leading-[0.98] tracking-[-0.03em]"
                style={{
                  fontSize: "clamp(2.75rem, 7vw, 6.5rem)",
                  animationDelay: "0.08s",
                }}
              >
                {t("title")}{" "}
                {/* Resaltado lima detrás de la palabra, como marcador */}
                <span className="box-decoration-clone bg-[linear-gradient(transparent_58%,#FFBE30_58%,#FFBE30_92%,transparent_92%)] px-1">
                  {t("titleAccent")}
                </span>
              </span>
            </h1>
            <p
              className="soft-in mx-auto mt-6 max-w-md text-base leading-relaxed text-[#787878] md:text-lg lg:mx-0"
              style={{ animationDelay: "0.16s" }}
            >
              {t("subtitle")}
            </p>

            <ul
              aria-label={t("channels.heading")}
              className="soft-in mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
              style={{ animationDelay: "0.24s" }}
            >
              {channels.map(({ icon: Icon, label, href, external }) => (
                <li key={href}>
                  <a
                    href={href}
                    {...(external && {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    })}
                    className="inline-flex items-center gap-2.5 rounded-full border-2 border-[#1E1E1E] bg-white px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-[#1E1E1E] transition-colors duration-500 ease-out hover:bg-[#FFBE30]"
                  >
                    <Icon size={17} aria-hidden />
                    <span className={external ? "" : "normal-case"}>
                      {label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Formulario en tarjeta blanca */}
          <div
            aria-label={t("formHeading")}
            role="region"
            className="soft-in min-w-0"
            style={{ animationDelay: "0.2s" }}
          >
            <ContactForm initialType={initialType} />
          </div>
        </div>
      </section>
    </main>
  );
}
