"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import img1899 from "@/public/images/history/1899.png";
import img1936 from "@/public/images/history/1936.png";
import img1948 from "@/public/images/history/1948.png";
import img1992 from "@/public/images/history/1992.png";

const bgImages = [img1899, img1936, img1948, img1992];

const colors = ["bg-cyan-400", "bg-cyan-500", "bg-cyan-400", "bg-cyan-500"];

export default function HistoryGrainAndGrains() {
  const t = useTranslations("history");
  const sections = t.raw("sections") as Array<{
    number: string;
    ano: string;
    title: string;
    text: string;
  }>;

  const [active, setActive] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement>(null);

  const setSectionRef = (index: number) => (el: HTMLElement | null) => {
    if (el) {
      // eslint-disable-next-line react-hooks/refs
      sectionRefs.current[index] = el;
      el.dataset.index = String(index);
    }
  };

  const setItemRef = (index: number) => (el: HTMLButtonElement | null) => {
    if (el) itemRefs.current[index] = el;
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

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="overflow-x-hidden bg-white">
      <section
        ref={setSectionRef(0)}
        className="text-cyan-950 min-h-screen flex items-center justify-center px-6 py-20 bg-cover bg-center lg:bg-fixed"
        style={{ backgroundImage: `url("/fondojapones.png")` }}
      >
        <div className="max-w-4xl w-full flex flex-col items-center justify-center text-center">
          <h1 className="font-normal tracking-wide text-[clamp(1rem,3.5vw,1.6rem)] mb-3">
            {t("intro1")}
          </h1>
          <strong className="font-black tracking-tight leading-[0.85] text-[clamp(3.3rem,14vw,10rem)] wrap-break-word">
            {t("tradition")}
          </strong>
        </div>
      </section>

      <section className="text-[#0a656f] bg-gray-100 py-15 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-[clamp(25px,2.2vw,22px)] font-normal leading-relaxed tracking-wide">
            {t.rich("intro2", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </h3>
        </div>
      </section>

      <section className="text-cyan-900 bg-white py-20 md:py-45 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-normal tracking-wide text-[clamp(1.4rem,5vw,1.6rem)] mb-3">
            {t("intro3")}
          </h1>
          <strong className="font-black tracking-tight leading-[0.85] text-[clamp(1.8rem,5vw,10rem)] wrap-break-word">
            {t("intro4")}
          </strong>
        </div>
      </section>

      {sections.map((section, i) => (
        <section
          key={i}
          ref={setSectionRef(i)}
          className={`text-cyan-950 min-h-screen flex items-center justify-center px-6 py-20 bg-cover bg-center lg:bg-fixed ${colors[i]}`}
          style={{
            backgroundImage: bgImages[i] ? `url(${bgImages[i].src})` : "none",
          }}
        >
          <div className="w-full lg:h-[50vh] grid grid-cols-1 lg:grid-cols-3 gap-50 lg:gap-30 items-center text-center lg:text-left">
            <div className="lg:text-white text-cyan-950 order-1 lg:order-2 self-center text-[clamp(120px,18vw,150px)] font-bold leading-none select-none">
              {section.ano}
              <strong className="flex lg:hidden w-full justify-center text-[18px] font-bold tracking-wide uppercase">
                {section.title}
              </strong>
            </div>
            <h2 className="text-cyan-900 self-center font-bold opacity-0 lg:opacity-100 order-2 lg:order-1 uppercase leading-tight text-[clamp(26px,4vw,42px)]">
              {section.title}
            </h2>
            <div className="text-cyan-950 order-3 z-10 max-w-xl mx-auto lg:mx-0 self-center">
              <p className="text-[clamp(16px,2vw,19px)] font-light leading-relaxed">
                {section.text}
              </p>
            </div>
          </div>
        </section>
      ))}

      <div
        ref={barRef}
        className="fixed bottom-0 left-0 w-full flex bg-cyan-900 z-50 overflow-x-auto scrollbar-hide"
      >
        {sections.map((section, i) => (
          <button
            key={i}
            ref={setItemRef(i)}
            onClick={() => scrollToSection(i)}
            className={`flex-1 min-w-30 uppercase text-[17px] tracking-widest py-4 flex items-center justify-center border-r border-white/10 transition-all cursor-pointer ${
              active === i
                ? "bg-cyan-500 text-gray-200 font-bold"
                : "text-cyan-400 hover:bg-cyan-900/10 font-bold"
            }`}
          >
            {section.ano}
          </button>
        ))}
      </div>
    </div>
  );
}
