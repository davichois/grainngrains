"use client";

import Image from "next/image";
import { MapPin, Handshake, ShieldCheck, Scale, BarChart2 } from "lucide-react";
import ourpromise from "@/public/images/about/ourpromise.png";
import { useTranslations } from "next-intl";

export default function OurPromise() {
  const t = useTranslations("supply-chain-excellence");
  const promises = [
    {
      icon: MapPin,
      title: t("ourPromise.items.traceability.title"),
      description: t("ourPromise.items.traceability.description"),
    },
    {
      icon: Handshake,
      title: t("ourPromise.items.commitmentToFarmersAndCooperatives.title"),
      description: t(
        "ourPromise.items.commitmentToFarmersAndCooperatives.description",
      ),
    },
    {
      icon: ShieldCheck,
      title: t("ourPromise.items.verification.title"),
      description: t("ourPromise.items.verification.description"),
    },
    {
      icon: Scale,
      title: t("ourPromise.items.riskAndCompliance.title"),
      description: t("ourPromise.items.riskAndCompliance.description"),
    },
    {
      icon: BarChart2,
      title: t("ourPromise.items.dataAndInsights.title"),
      description: t("ourPromise.items.dataAndInsights.description"),
    },
  ];

  return (
    <section className="py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-5 md:px-10 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-24">
        {/* Image */}
        <div className="w-full lg:w-1/2 border border-gray-200 p-5 md:p-10">
          <Image
            src={ourpromise}
            alt="Supply Chain Excellence - Our Promise"
            width={700}
            height={740}
            className="w-full h-auto object-cover object-center"
          />
        </div>

        {/* Content */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          {/* Eyebrow heading */}
          <div className="pt-2 md:pt-7">
            <p className="text-cyan-900 flex flex-col gap-2 mb-4">
              <span className="block w-15 md:w-20 h-px md:h-0.5 bg-cyan-800" />
              <span className="font-semibold text-xl md:text-2xl leading-none">
                {t("ourPromise.title")}
              </span>
            </p>
            <h3 className="text-2xl md:text-4xl font-semibold text-gray-900">
              {t("ourPromise.subtitle")}
            </h3>
          </div>

          {/* Promise items */}
          <div className="flex flex-col gap-6 md:gap-8">
            {promises.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-5 md:gap-6 items-start">
                <div className="p-4 shrink-0 rounded-sm">
                  <Icon size={36} strokeWidth={1.5} className="text-cyan-900" />
                </div>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  <strong className="font-semibold text-gray-900">
                    {title}:
                  </strong>{" "}
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
