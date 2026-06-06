"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/src/i18n/navigation";
import { normalizeCode } from "./data";

export default function Traceability() {
  const t = useTranslations("");
  const router = useRouter();

  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // El prefijo "GG" es fijo; el usuario solo escribe el número
    const key = normalizeCode(`GG${input}`);
    if (key === "GG") return; // sin número aún
    // Navega a la página de resultado, donde ocurre la simulación de carga
    router.push(`/traceability/${key}`);
  };

  return (
    <div>
      <section className="relative mt-10 md:mt-20 lg:mt-20 flex min-h-[90vh] w-full items-center justify-center overflow-hidden px-5 py-16 sm:px-6">
        {/* Fondo */}
        <Image
          src="/images/forestland.svg"
          alt=""
          fill
          priority
          className="object-cover"
        />

        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center text-[#00736B]">
          <span className="mb-5 inline-flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.3em] sm:mb-6 sm:text-xs">
            Grain &amp; Grains
          </span>

          <h1
            className="w-full select-none wrap-break-word font-black uppercase leading-[0.85] tracking-[-1px] sm:tracking-[-2px]"
            style={{
              fontSize: "clamp(1.5rem, 6vw, 8rem)",
              color: "#00736B",
            }}
          >
            {t("traceability.title")}
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm font-medium leading-relaxed text-[#00736B]/80 sm:mt-6 sm:text-base md:text-lg">
            {t("traceability.subtitle")}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 flex w-full max-w-xl flex-col gap-3 sm:mt-10 sm:flex-row"
          >
            <div className="flex flex-1 items-stretch border-4 border-[#00736B] bg-white transition-colors ">
              <span className="flex select-none items-center bg-[#00736B] px-3 text-sm font-black uppercase tracking-wide text-[#ffffff] sm:px-4 sm:text-base">
                GG-
              </span>
              <input
                inputMode="numeric"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full flex-1 bg-transparent py-3 pl-3 pr-4 text-base font-medium text-black outline-none sm:py-3.5 sm:pl-4 sm:pr-5"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className="inline-flex cursor-pointer items-center justify-center gap-2 border-4 border-[#00736B] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#00736B] transition-colors duration-200 hover:bg-[#00736B] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:px-8 sm:py-3.5 sm:text-base"
            >
              {t("traceability.search")}
            </button>
          </form>
        </div>
      </section>
      <section className="flex min-h-[50svh] md:min-h-[60svh] lg:min-h-[70vh] w-full items-center justify-center bg-[#F63049] px-6 py-12 md:px-10 md:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="uppercase leading-[0.82]">
            <span
              className="block font-light tracking-tight text-[#FFE054]"
              style={{
                fontSize: "clamp(1.75rem, 5vw, 5.5rem)",
              }}
            >
              {t("home.sections.0.title")}
            </span>

            <span
              className="block font-black tracking-[-0.03em] text-[#FFE054]"
              style={{
                fontSize: "clamp(3rem, 10vw, 8.75rem)",
              }}
            >
              {t("home.sections.0.subtitle")}
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xs text-sm leading-[1.4] text-[#FFE054] sm:max-w-lg sm:text-base md:mt-8 md:max-w-2xl lg:mt-10 lg:max-w-3xl lg:text-lg">
            {t("home.sections.0.description")}
          </p>

          <Link
            href="/sustainability"
            className="inline-block mt-8 text-amber-50 border-2 border-amber-50 px-6 py-2 text-sm font-semibold uppercase tracking-wide transition-colors duration-300 hover:bg-[#F63049] hover:text-[#FFE054] hover:border-[#FFE054] focus:outline-none focus:ring-2 focus:ring-[#F63049] focus:ring-offset-2 md:mt-12 md:px-8 md:py-2 md:text-base lg:mt-16 lg:px-10 lg:py-3 lg:text-lg"
          >
            {t("home.readMore")}
          </Link>
        </div>
      </section>
      <section className="flex  items-center justify-center bg-[#00b8db] w-full py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-lg md:text-2xl font-light tracking-wide text-sky-700 uppercase">
            {t("home.sections.1.title")}
          </p>

          <h2 className="font-black uppercase leading-[0.9] tracking-tight text-sky-950 text-[clamp(3.5rem,10vw,8rem)]">
            {t("home.sections.1.subtitle")}
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-lg md:text-2xl leading-relaxed text-sky-800">
            {t("home.sections.1.description")}
          </p>

          <Link
            href="/about"
            className="inline-block mt-8 text-amber-50 border-2 border-amber-50 px-6 py-2 text-sm font-semibold uppercase tracking-wide transition-colors duration-300  hover:text-cyan-800 hover:border-cyan-900 focus:outline-none focus:ring-2 focus:ring-[#F63049] focus:ring-offset-2 md:mt-12 md:px-8 md:py-2 md:text-base lg:mt-16 lg:px-10 lg:py-3 lg:text-lg"
          >
            {t("home.knowMore")}
          </Link>
        </div>
      </section>
    </div>
  );
}
