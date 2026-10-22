"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Check, Download, Share, SquarePlus, X } from "lucide-react";
import { installApp, useInstallApp } from "@/src/lib/install-app";

/**
 * "Instalar app" en computadora: pestaña pegada al borde derecho que se
 * asoma solo con el ícono y se desliza completa al pasar el mouse o al
 * tocarla (el segundo toque instala). En celular está en el menú.
 */
export default function InstallAppButton() {
  const t = useTranslations("installApp");
  const { mode, done } = useInstallApp();
  const [open, setOpen] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  /* ¿Estaba desplegada antes de este toque? (el foco la abre al tocar) */
  const wasOpen = useRef(false);
  const touch = useRef(false);

  const onClick = () => {
    /* Con pantalla táctil el primer toque solo la despliega */
    if (touch.current && !wasOpen.current) return setOpen(true);
    if (mode === "ios") return setIosHelp((v) => !v);
    installApp();
  };

  return (
    <>
      {mode !== "hidden" && (
        <div
          className="fixed bottom-36 right-0 z-40 hidden lg:block"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => {
            setOpen(false);
            setIosHelp(false);
          }}
        >
          {/* Pasos para iPad (Safari no instala con un botón) */}
          {iosHelp && (
            <div
              role="dialog"
              aria-label={t("iosTitle")}
              className="soft-fade absolute bottom-full right-4 mb-3 w-64 rounded-2xl border border-[#116e78] bg-white p-4 pr-9 font-ui text-sm text-[#1E1E1E] shadow-[0px_12px_30px_-10px_rgba(0,0,0,0.25)]"
            >
              <button
                type="button"
                onClick={() => setIosHelp(false)}
                aria-label={t("close")}
                className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#787878] hover:text-[#1E1E1E]"
              >
                <X size={16} />
              </button>
              <p className="font-semibold text-[#116e78]">{t("iosTitle")}</p>
              <ol className="mt-2 space-y-1.5">
                <li className="flex items-center gap-2">
                  <Share size={16} aria-hidden className="shrink-0" />
                  {t("iosStep1")}
                </li>
                <li className="flex items-center gap-2">
                  <SquarePlus size={16} aria-hidden className="shrink-0" />
                  {t("iosStep2")}
                </li>
              </ol>
            </div>
          )}

          {/* La pestaña: asoma 64 px (el ícono) y se desliza completa */}
          <button
            type="button"
            onPointerDown={(e) => {
              touch.current = e.pointerType === "touch";
              wasOpen.current = open;
            }}
            onClick={onClick}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            aria-label={t("aria")}
            aria-expanded={open}
            className="group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-l-full border-2 border-r-0 border-[#1E1E1E] bg-[#1E1E1E] py-2 pl-2 pr-6 font-ui text-white shadow-[-12px_14px_34px_-12px_rgba(0,0,0,0.55)] outline-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-[#FFBE30]"
            style={{
              transform: open
                ? "translateX(0)"
                : "translateX(calc(100% - 4rem))",
            }}
          >
            {/* Brillo que cruza la pestaña al desplegarse */}
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ${
                open ? "translate-x-[400%]" : "translate-x-0"
              }`}
            />
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1E1E1E] shadow-inner">
              <Download
                size={20}
                aria-hidden
                className={open ? "" : "install-nudge"}
              />
            </span>
            <span className="relative flex flex-col items-start whitespace-nowrap leading-tight">
              <span className="text-[15px] font-bold">{t("button")}</span>
              <span className="text-[11px] font-medium text-white/75">
                {t("tagline")}
              </span>
            </span>
          </button>
        </div>
      )}

      {/* Aviso al terminar de instalar */}
      {done && (
        <p
          role="status"
          className="soft-fade fixed bottom-20 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#116e78] px-4 py-2.5 font-ui text-sm font-medium text-white shadow-[0px_12px_30px_-10px_rgba(0,0,0,0.35)] sm:bottom-24 sm:right-6"
        >
          <Check size={16} aria-hidden />
          {t("done")}
        </p>
      )}
    </>
  );
}
