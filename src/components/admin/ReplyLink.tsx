"use client";

import { markReplied } from "@/src/app/admin/(panel)/actions/messages";

/** Enlace para responder (correo o WhatsApp) que marca el mensaje como respondido */
export default function ReplyLink({
  id,
  href,
  icon,
  label,
  external,
}: {
  id: string;
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      onClick={() => void markReplied(id)}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className="inline-flex max-w-full items-center gap-2 truncate border border-[#0FC0FC] bg-[#0FC0FC] px-3.5 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[#1E1E1E] transition-colors hover:border-adm-strong hover:bg-adm-solid hover:text-white"
    >
      {icon}
      <span className="truncate">{label}</span>
    </a>
  );
}
