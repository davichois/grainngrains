"use client";

import { useTranslations } from "next-intl";

export default function CoffeeTicker() {
  const t = useTranslations("editions");

  const items = [
    t("farmers.name"),
    t("farmers.products.donEliseoFarm"),
    t("farmers.products.donEdwinFarm"),
    t("farmers.products.donOsmarFarm"),
    t("women.name"),
    t("women.products.daughtersOfTheForest"),
    t("women.products.guardiansOfTheEarth"),
    t("classic.name"),
    t("classic.products.morningClassic"),
    t("infused.name"),
    t("infused.products.vanilla-infused"),
    t("infused.products.guanabana-infused"),
  ];

  return (
    <>
      <style jsx>{`
        .ticker {
          animation: marquee 35s linear infinite;
        }

        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>

      <div className="h-8 overflow-hidden border-y border-neutral-200">
        <div className="ticker flex h-full min-w-max items-center whitespace-nowrap">
          {[...items, ...items].map((item, index) => (
            <span
              key={index}
              className="mx-5 text-[11px] uppercase tracking-[0.18em] text-neutral-700"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
