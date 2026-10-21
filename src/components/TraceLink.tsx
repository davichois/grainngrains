import type { ReactNode } from "react";
import { TRACEABILITY_URL } from "@/src/lib/site";

/** Cada mención de trazabilidad en los textos va marcada como
 *  <trace>…</trace> (en todos los idiomas) y lleva a Forestland Sentinel,
 *  nuestra página de trazabilidad. Se usa con t.rich: { trace: traceLink } */
export function traceLink(chunks: ReactNode) {
  return (
    <a
      href={TRACEABILITY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-current/40 decoration-1 underline-offset-[3px] transition-[text-decoration-color] duration-300 hover:decoration-current"
    >
      {chunks}
    </a>
  );
}

/** Para textos planos (metadatos, correos): la mención queda sin enlace */
export const traceText = (chunks: ReactNode) => chunks;
