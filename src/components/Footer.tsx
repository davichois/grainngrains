"use client";

import { Caveat } from "next/font/google";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaFacebook } from "react-icons/fa";
import { Link } from "../i18n/navigation";
import { useTranslations } from "next-intl";
import { GrainngrainsLogo } from "./GrainngrainsLogo";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13.5px] font-semibold text-[#116e78] uppercase mb-1">
        {heading}
      </p>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[14.5px] text-gray-400 hover:text-cyan-900 transition-colors duration-150 leading-snug"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const t = useTranslations("nav");
  const tbase = useTranslations();
  const year = new Date().getFullYear();

  const navColumns = [
    {
      heading: t("ourCoffee"),
      links: [
        {
          label: t("ourCollection"),
          href: "/our-coffee/products",
        },
        {
          label: t("greenCoffee"),
          href: "/shop",
        },
        {
          label: t("verifyTraceability"),
          href: "/traceability",
        },
      ],
    },
    {
      heading: t("sustainability"),
      links: [
        {
          label: t("sustainability"),
          href: "/sustainability",
        },

        // {
        //   label: t("prosperousFarmers"),
        //   href: "/sustainability/prosperous-farmers",
        // },
        // {
        //   label: t("thrivingCommunities"),
        //   href: "/sustainability/thriving-communities",
        // },
        // {
        //   label: t("coffee"),
        //   href: "/sustainability/sustainability-in-coffee",
        // },
      ],
    },
    {
      heading: t("aboutGG"),
      links: [
        { label: `${t("ggHistory")} Grain & Grains`, href: "/about" },
        {
          label: t("meetPartner"),
          href: "/about/partner-cooperatives",
        },
        { label: t("globalFootprint"), href: "/about/global-footprint" },
        {
          label: t("supplyChainExcellence"),
          href: "/about/supply-chain-excellence",
        },
      ],
    },
  ];

  const socials = [
    {
      icon: FaInstagram,
      href: "https://www.instagram.com/grainngrains",
      label: "Instagram",
    },
    { icon: FaLinkedinIn, href: "https://www.linkedin.com/company/grain-grains-coffee", label: "LinkedIn" },
    {
      icon: FaFacebook,
      href: "https://www.facebook.com/profile.php?id=61584672518944",
      label: "Facebook",
    },
  ];

  const contact = [
    { icon: Phone, text: "+51 930 625 619" },
    { icon: Mail, text: "tradingna@grainngrains.org" },
  ];

  return (
    <footer className="w-full bg-white">
      <div className="max-w-8xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* ── CTA STRIP ── */}
        <div className="py-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span
              className={`text-[#ffbe30] text-2xl ${caveat.className}`}
              style={{ display: "inline-block", transform: "rotate(-1.5deg)" }}
            >
              {tbase("CTA.title")}
            </span>
            <p className="text-4xl md:text-7xl font-black text-gray-800 mt-0.5">
              {tbase("CTA.subtitle")}
              <span className="text-[#116e78]"> {tbase("CTA.together")}</span>
            </p>
          </div>

          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
              "tradingna@grainngrains.org",
            )}&su=${encodeURIComponent(
              "Contacto — Grain & Grains",
            )}&body=${encodeURIComponent(
              "Hola equipo de Grain & Grains,\n\nMe gustaría ponerme en contacto con ustedes para obtener más información.\n\nGracias.",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 border border-[#116e78] text-[#116e78] text-xl font-medium px-6 py-4 hover:bg-[#116e78] hover:text-white transition-all duration-200 shrink-0 rounded-full"
          >
            <Mail size={18} />
            <span>{tbase("CTA.contact")}</span>
            <ArrowUpRight
              size={18}
              className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </a>
        </div>

        {/* ── DIVIDER ── */}
        <div className="h-px bg-gray-200" />

        {/* ── TOP SECTION ── */}
        <div className="py-10 flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Brand block */}
          <div className="flex flex-col gap-6 lg:w-64 shrink-0">
            {/* Logo */}
            <div className="shrink-0">
              <GrainngrainsLogo tagline={t("farmToFuture")} />
            </div>

            {/* Description */}
            <p className="text-[14px] text-gray-400 leading-relaxed">
              {tbase("motto")}
            </p>

            {/* Contact */}
            <ul className="flex flex-col gap-2">
              {contact.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2">
                  <Icon size={13} className="text-[#116e78] mt-0.75 shrink-0" />
                  <span className="text-[13.5px] text-gray-400">{text}</span>
                </li>
              ))}
            </ul>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-[#116e78] hover:text-[#116e78] transition-all duration-200"
                >
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="lg:hidden h-px bg-gray-200" />
          <div className="hidden lg:block w-px bg-gray-200 self-stretch" />

          {/* Nav columns */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {navColumns.map((col) => (
              <FooterColumn
                key={col.heading}
                heading={col.heading}
                links={col.links}
              />
            ))}
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-gray-400">
          <p>{`© ${year} Lazo 360 S.A.C. ${tbase("footer.copyright")} - RUC: 20615209016`}</p>

          <nav className="items-center gap-4 flex-wrap justify-center hidden">
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Use", href: "/terms" },
              { label: "Cookie Settings", href: "/cookies" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-gray-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
