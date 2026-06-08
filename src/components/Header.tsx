"use client";

import { useLocale, useMessages, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation"; // next normal
import { routing } from "../i18n/routing"; // tu archivo de config

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Globe,
  Menu,
  X,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "../i18n/navigation";
import {
  Language,
  LanguageSelectorProps,
  MainNavItem,
  UtilityNavItem,
} from "../types";
import { GrainngrainsLogo } from "./GrainngrainsLogo";
import { useHeaderVisibility } from "./HeaderVisibility";
import CoffeeTicket from "@/src/components/CoffeeTicket";

/* Píxeles de scroll a partir de los cuales reaparece el header oculto */
const REVEAL_AT = 4;

/* Bandera (emoji) según el código de idioma */
const FLAGS: Record<string, string> = {
  en: "🇬🇧",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇵🇪",
  pt: "🇵🇹",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
};

function LanguageDropdown({ languages }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const selected =
    languages.find((l) => l.code === currentLocale) ?? languages[0];

  // Cierra al click afuera (igual que antes)
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleSelect = (lang: (typeof languages)[0]) => {
    setOpen(false);
    // Extrae el pathname sin el prefijo del locale actual
    const segments = pathname.split("/");
    const locales = routing.locales as readonly string[];
    const withoutLocale = locales.includes(segments[1])
      ? "/" + segments.slice(2).join("/")
      : pathname;

    router.push(`/${lang.code}${withoutLocale}`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 text-[18px] font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 pb-4 pt-4 border-b-2 ${
          open
            ? "text-[#ffbe30] border-[#ffbe30]"
            : "text-gray-600 border-transparent hover:text-[#ffbe30]"
        }`}
      >
        <Globe size={20} className="text-[#ffbe30] shrink-0" />

        <span>{selected.abreviation}</span>
        <ChevronDown
          size={13}
          className={`text-gray-600 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute top-full right-0 mt-2 bg-white shadow-2xl border border-gray-100 min-w-full z-50 overflow-hidden transition-all duration-200 origin-top ${
          open
            ? "opacity-100 scale-y-100 pointer-events-auto"
            : "opacity-0 scale-y-95 pointer-events-none"
        }`}
      >
        <ul className="py-1.5">
          {languages.map((lang) => (
            <li key={lang.code}>
              <button
                onClick={() => handleSelect(lang)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-md transition-colors cursor-pointer ${
                  selected.code === lang.code
                    ? "text-[#ffbe30] font-semibold bg-gray-300/20"
                    : "text-gray-700 hover:bg-gray-50 hover:text-[#ffbe30]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-[18px] leading-none">
                    {FLAGS[lang.code] ?? "🏳️"}
                  </span>
                  {lang.label}
                </span>
                {selected.code === lang.code && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffbe30]" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function UtilityDropdown({ item }: { item: UtilityNavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        onClick={() => setOpen(!open)}
        className={`cursor-pointer flex items-center gap-1 text-[18px] font-semibold transition-all duration-200 pb-4 pt-4 border-b-2 whitespace-nowrap ${
          open
            ? "text-[#116e78] border-[#116e78]"
            : "text-gray-600 border-transparent hover:text-[#116e78]"
        }`}
      >
        <span>
          {item.name} <strong className="font-bold">G&G</strong>
        </span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 mt-0.5 shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute top-full left-0 pt-2 min-w-60 z-50 transition-all duration-200 origin-top ${
          open
            ? "opacity-100 scale-y-100 pointer-events-auto"
            : "opacity-0 scale-y-95 pointer-events-none"
        }`}
      >
        <div className="bg-white shadow-2xl border border-gray-100 overflow-hidden">
          <Link
            href={item.href}
            className="flex items-center justify-between px-5 py-3.5 bg-[#116e78]/5 border-b border-gray-100 text-md font-semibold text-[#116e78] hover:bg-[#116e78]/10 transition-colors"
          >
            <span>
              {item.historyLabel} <strong>G&G</strong>
            </span>
            <ArrowUpRight size={13} />
          </Link>
          <ul className="py-1.5">
            {item.dropdown!.map((sub) => (
              <li key={sub.label}>
                <Link
                  href={sub.href}
                  className="flex items-center justify-between px-5 py-2.5 text-md text-gray-700 hover:bg-gray-50 hover:text-[#116e78] transition-colors group"
                >
                  <span>{sub.label}</span>
                  <ChevronRight
                    size={11}
                    className="text-gray-300 group-hover:text-[#116e78] transition-colors"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MegaMenuItem({
  item,
  active,
  onToggle,
  onOpen,
  onClose,
  mobile = false,
}: {
  item: MainNavItem;
  active: boolean;
  onToggle: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  mobile?: boolean;
}) {
  const hasDropdown = item.columns.length > 0;

  // Cierre con retardo: evita que un mínimo hueco entre el botón y el panel
  // cierre el menú antes de poder llegar a las opciones.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onOpen?.();
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => onClose?.(), 150);
  };
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  if (mobile) {
    return (
      <li>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between py-4 border-b border-gray-100 text-base font-semibold text-gray-800 hover:text-[#116e78] transition-colors"
        >
          <span>{item.name}</span>
          {hasDropdown && (
            <ChevronDown
              size={16}
              className={`text-[#116e78] transition-transform duration-300 shrink-0 ${active ? "rotate-180" : ""}`}
            />
          )}
        </button>
        {hasDropdown && (
          <div
            className={`overflow-hidden transition-all duration-300 ${active ? "max-h-175" : "max-h-0"}`}
          >
            <div className="pb-3">
              {item.columns.map(
                (
                  col: {
                    heading: string;
                    links: Array<{ label: string; href: string }>;
                  },
                  i: number,
                ) => (
                  <div
                    key={col.heading}
                    className={`flex-1 px-5 py-6 min-w-0 ${
                      i < item.columns.length - 1
                        ? "border-r border-gray-100"
                        : ""
                    }`}
                  >
                    <div className="mb-4">
                      <span className="block w-6 h-0.5 bg-[#116e78] mb-2" />
                      <p className="text-[12px] font-bold text-[#116e78] uppercase tracking-widest">
                        {col.heading}
                      </p>
                    </div>
                    <ul>
                      {col.links.map(
                        (link: { label: string; href: string }) => (
                          <li key={link.label}>
                            <Link
                              href={link.href}
                              className="flex items-center justify-between py-2 text-md text-gray-700 font-normal hover:text-[#116e78] transition-colors group/link"
                            >
                              <span className="truncate pr-2">
                                {link.label}
                              </span>
                              <ChevronRight
                                size={11}
                                className="text-gray-200 group-hover/link:text-[#116e78] transition-colors shrink-0"
                              />
                            </Link>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </li>
    );
  }

  return (
    <li
      className="group relative h-full flex items-stretch"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        onClick={onToggle}
        className={` cursor-pointer flex items-center gap-1 text-[18px] xl:text-[18px] font-semibold transition-all duration-200 px-0 pb-4 pt-4 border-b-2 whitespace-nowrap ${
          active
            ? "text-[#116e78] border-[#116e78]"
            : "text-gray-600 border-transparent hover:text-[#116e78]"
        }`}
      >
        <span>{item.name}</span>
        {hasDropdown && (
          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform duration-300 mt-0.5 ${active ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* MEGA DROPDOWN — bounded to viewport width */}
      {hasDropdown && (
        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 z-50 pt-1 transition-all duration-300 origin-top group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto ${
            active
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-1 pointer-events-none"
          }`}
        >
          <div
            className="bg-white flex overflow-hidden"
            style={{
              width: `min(${item.columns.length * 250}px, calc(100vw - 2rem))`,
            }}
          >
            {item.columns.map((col, i) => (
              <div
                key={col.heading}
                className={`flex-1 px-5 py-6 min-w-0 ${
                  i < item.columns.length - 1 ? "border-r border-gray-100" : ""
                }`}
              >
                <div className="mb-4">
                  <span className="block w-6 h-0.5 bg-[#116e78] mb-2" />
                  <p className="text-[12px] font-bold text-[#116e78] uppercase tracking-widest">
                    {col.heading}
                  </p>
                </div>
                <ul>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="flex items-center justify-between py-2 text-md text-gray-700 font-normal hover:text-[#116e78] transition-colors group/link"
                      >
                        <span className="truncate pr-2">{link.label}</span>
                        <ChevronRight
                          size={11}
                          className="text-gray-200 group-hover/link:text-[#116e78] transition-colors shrink-0"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

export default function Header() {
  const t = useTranslations("nav");

  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeMain, setActiveMain] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const headerVis = useHeaderVisibility();

  /* Oculto arriba del todo cuando la página activa lo pide; reaparece al bajar.
     No se oculta si hay un menú abierto (móvil o desplegable de escritorio),
     para no esconderlo mientras el usuario interactúa con él. */
  const hidden =
    !!headerVis?.hideAtTop && !mobileOpen && !activeMain && scrollY < REVEAL_AT;

  const messages = useMessages() as {
    language: Language[];
  };
  const languages = messages.language;

  const mainNav = [
    {
      name: t("ourCoffee"),
      href: "/our-coffee",
      columns: [
        {
          heading: t("ourCoffeeHeading"),
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
        // {
        //   heading: t("innovation"),
        //   links: [
        //     {
        //       label: t("coffeeInnovation"),
        //       href: "/our-coffee/innovation-in-coffee",
        //     },
        //   ],
        // },
      ],
    },
    {
      name: t("sustainability"),
      href: "/sustainability",
      columns: [
        {
          heading: t("focusAreas"),
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
          ],
        },
        // {
        //   heading: t("byProduct"),
        //   links: [
        //     {
        //       label: t("coffee"),
        //       href: "/sustainability/sustainability-in-coffee",
        //     },
        //   ],
        // },
      ],
    },
  ];

  const utilityNav = [
    {
      name: t("aboutGG"),
      bold: true,
      href: "/about",
      historyLabel: t("ggHistory"), // ← agrega esto
      dropdown: [
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      setScrollY(window.scrollY);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node))
        setActiveMain(null);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveMain(null);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Cierra todo al navegar (evita que la opción quede "pegada")
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setActiveMain(null);
    setMobileOpen(false);
    setMobileExpanded(null);
  }

  return (
    <>
      <header
        ref={headerRef}
        className={`w-full pt-2 z-50 fixed transition-all duration-300
  ${scrolled ? "bg-white shadow-[0px_12px_30px_-10px_rgba(0,0,0,0.15)]" : "bg-white"}
  ${hidden ? "-translate-y-full" : "translate-y-0"}
  `}
      >
        <div className="w-full max-w-screen-2xl mx-auto sm:px-10 px-2 ">
          {/* ── TOP BAR: logo + utility nav ── */}
          <div className="flex items-center px-4 lg:px-8 xl:px-10 py-2">
            {/* Logo */}
            <div className="shrink-0">
              <GrainngrainsLogo tagline={t("farmToFuture")} />
            </div>

            {/* Desktop utility nav */}
            <nav className="hidden lg:flex items-center gap-3 xl:gap-5 ml-auto min-w-0">
              <ul className="flex items-stretch gap-3 xl:gap-6 justify-end flex-wrap">
                {mainNav.map((item) => (
                  <MegaMenuItem
                    key={item.name}
                    item={item}
                    active={activeMain === item.name}
                    onToggle={() =>
                      setActiveMain((p) => (p === item.name ? null : item.name))
                    }
                    onOpen={() => setActiveMain(item.name)}
                    onClose={() => setActiveMain(null)}
                  />
                ))}
              </ul>
              {utilityNav.map((item) =>
                item.dropdown ? (
                  <UtilityDropdown key={item.name} item={item} />
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-[18px] text-gray-600 hover:text-[#116e78] transition-colors font-semibold whitespace-nowrap"
                  >
                    {item.name}
                  </Link>
                ),
              )}

              {/* <span className="w-px h-4 bg-gray-500 shrink-0" />
              <CircleUserRound
                size={25}
                className="text-gray-600 hover:text-[#116e78] cursor-pointer transition-colors"
              /> */}

              <span className="w-px h-4 bg-gray-500 shrink-0" />
              <LanguageDropdown languages={languages} />
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden ml-auto shrink-0 text-gray-700 hover:text-[#116e78] transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
        <CoffeeTicket />
      </header>

      {/* ── MOBILE DRAWER ── */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={` sm:px-20 p-4 lg:hidden fixed top-0 right-0 h-svh w-full max-w-full bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <GrainngrainsLogo tagline={t("farmToFuture")} />
          <button
            onClick={() => setMobileOpen(false)}
            className="text-gray-500 hover:text-[#116e78] transition-colors"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          <ul>
            {mainNav.map((item) => (
              <MegaMenuItem
                key={item.name}
                item={item}
                active={mobileExpanded === item.name}
                onToggle={() =>
                  setMobileExpanded((p) => (p === item.name ? null : item.name))
                }
                mobile
              />
            ))}
          </ul>

          <div className="my-4 h-px bg-gray-100" />

          <ul className="flex flex-col">
            {utilityNav.map((item) => {
              const active = mobileExpanded === item.name;

              if (!item.dropdown) {
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between py-3.5 border-b border-gray-100 text-sm font-medium text-gray-700 hover:text-[#116e78]"
                    >
                      {item.name}
                      <ChevronRight size={13} className="text-gray-300" />
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.name}>
                  <button
                    onClick={() =>
                      setMobileExpanded((p) =>
                        p === item.name ? null : item.name,
                      )
                    }
                    className="w-full flex items-center justify-between py-3.5 border-b border-gray-100 text-sm font-medium text-gray-700 hover:text-[#116e78]"
                  >
                    <span>
                      {t("aboutGG")} <strong>G&G</strong>
                    </span>

                    <ChevronDown
                      size={13}
                      className={`transition-transform ${active ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      active ? "max-h-40" : "max-h-0"
                    }`}
                  >
                    <ul className="pl-4 pb-2">
                      {item.dropdown.map((sub) => (
                        <li key={sub.label}>
                          <Link
                            href={sub.href}
                            className="flex items-center gap-2 py-2 text-sm text-gray-600 hover:text-[#116e78]"
                          >
                            <ChevronRight
                              size={11}
                              className="text-[#116e78]/40"
                            />
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                      <Link
                        href={item.href}
                        className="flex items-center justify-between py-2 text-sm text-[#116e78] font-medium hover:text-[#116e78]/80"
                      >
                        <span>
                          {item.historyLabel} <strong>G&G</strong>
                        </span>
                        <ArrowUpRight size={13} className="text-[#116e78]" />
                      </Link>
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <LanguageDropdown languages={languages} />
          </div>
        </div>
      </aside>
    </>
  );
}
