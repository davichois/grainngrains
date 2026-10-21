"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { whatsappUrl } from "@/src/lib/site";

/**
 * Botón flotante de WhatsApp: abre el chat con un mensaje ya escrito
 * ("Quiero comprar su café y apoyar a un caficultor…") y la página desde
 * la que escribe.
 */
export default function WhatsAppButton() {
  const t = useTranslations("contact");

  const open = (e: React.MouseEvent<HTMLAnchorElement>) => {
    /* Agrega la página actual al mensaje, para saber de qué producto habla */
    e.currentTarget.href = whatsappUrl(
      `${t("whatsappButtonMessage")}\n${window.location.href}`,
    );
  };

  /* Mismo modelo que el botón "Ponte en contacto" del pie: píldora blanca
     con borde teal que se rellena al pasar el mouse */
  return (
    <a
      href={whatsappUrl(t("whatsappButtonMessage"))}
      onClick={open}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("whatsappAria")}
      className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 rounded-full border border-[#116e78] bg-white p-1.5 font-ui text-[#116e78] shadow-[0px_12px_30px_-10px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#116e78] hover:text-white sm:bottom-6 sm:right-6 sm:pr-5"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#116e78] text-white transition-colors duration-200 group-hover:bg-white group-hover:text-[#116e78]">
        <FaWhatsapp size={22} aria-hidden />
      </span>
      {/* En celular solo el ícono; en pantallas grandes, el texto */}
      <span className="hidden text-[15px] font-medium sm:inline">
        {t("whatsappButton")}
      </span>
      <ArrowUpRight
        size={16}
        aria-hidden
        className="-ml-1 hidden opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 sm:block"
      />
    </a>
  );
}
