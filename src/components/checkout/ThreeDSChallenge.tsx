"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { ShieldCheck, X } from "lucide-react";

const FRAME = "mp-3ds-frame";

/**
 * Verificación 3D Secure: la página del banco se abre en un iframe dentro
 * del checkout (sin salir de la tienda). Al terminar, el iframe avisa con
 * postMessage { status: "COMPLETE" }.
 */
export default function ThreeDSChallenge({
  url,
  creq,
  onComplete,
  onCancel,
}: {
  url: string;
  creq: string;
  /** El banco terminó la verificación: toca consultar el estado del pago */
  onComplete: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("checkout");
  const form = useRef<HTMLFormElement>(null);

  /* Envía el creq al banco dentro del iframe */
  useEffect(() => {
    form.current?.submit();
  }, [url, creq]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data && (e.data as { status?: string }).status === "COMPLETE") {
        onComplete();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onComplete]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tds-title"
      className="fixed inset-0 z-90 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div className="flex max-h-svh w-full flex-col overflow-hidden rounded-t-xl bg-white shadow-xl sm:w-auto sm:rounded-xl">
        <div className="flex items-start gap-3 border-b border-gray-200 px-4 py-3">
          <ShieldCheck
            size={20}
            aria-hidden
            className="mt-0.5 shrink-0 text-[#116e78]"
          />
          <div className="min-w-0 flex-1">
            <p id="tds-title" className="text-sm font-semibold text-gray-900">
              {t("challengeTitle")}
            </p>
            <p className="text-xs text-gray-500">{t("challengeHint")}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t("challengeCancel")}
            className="cursor-pointer rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={18} />
          </button>
        </div>
        {/* Medidas sugeridas por Mercado Pago: 500×600 (móvil: ancho completo × 440) */}
        <iframe
          id={FRAME}
          name={FRAME}
          title={t("challengeTitle")}
          className="h-[440px] w-full bg-white sm:h-[600px] sm:w-[500px]"
        />
        <form ref={form} method="post" action={url} target={FRAME} hidden>
          <input type="hidden" name="creq" value={creq} />
        </form>
      </div>
    </div>
  );
}
