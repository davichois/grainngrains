"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FAQSectionProps } from "../types";

export default function Faqs({ faqs }: FAQSectionProps) {
  const [openId, setOpenId] = useState<number | null>(1);
  const t = useTranslations();

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
      style={{ backgroundColor: "#1a3a4a" }}
    >
      {/* Title */}
      <h2 className="text-7xl md:text-8xl font-extrabold mb-16 tracking-tight text-[#FFB900] text-center">
        {t("faqs.heading")}
      </h2>

      {/* Accordion */}
      <div className="w-full max-w-5xl">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;

          return (
            <div key={faq.id} className="mb-1">
              {/* Question row */}
              <button
                onClick={() => toggle(faq.id)}
                className="cursor-pointer w-full flex items-center justify-between py-5 px-2 text-left group transition-opacity duration-200 hover:opacity-80 focus:outline-none"
                aria-expanded={isOpen}
              >
                <span className="text-base md:text-2xl font-extrabold flex-1 text-center text-[#FFB900]">
                  {faq.question}
                </span>

                {/* Plus / Minus icon */}
                <span
                  className="ml-4 shrink-0 text-3xl font-thin transition-transform duration-300"
                  style={{
                    color: "#FFB900",
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  +
                </span>
              </button>

              {/* Answer */}
              <div
                className="overflow-hidden transition-all duration-400 ease-in-out"
                style={{
                  maxHeight: isOpen ? "200px" : "0px",
                  transition: "max-height 0.35s ease",
                }}
              >
                <p
                  className={`
    pb-5 px-2 text-center text-sm md:text-2xl font-light
    text-[#FFB900]
    transition-opacity duration-300 ease-in delay-100
    ${isOpen ? "opacity-100" : "opacity-0"}
  `}
                >
                  {faq.answer}
                </p>
              </div>

              {/* Divider */}
              <div className="w-full h-[0.2] bg-amber-500" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
