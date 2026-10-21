/* Formulario de contacto y cotización: tipos de consulta y validación
   (la usan el formulario y el servidor). */

export const INQUIRY_TYPES = [
  "general",
  "greenQuote",
  "roastedQuote",
  "wholesale",
] as const;
export type InquiryType = (typeof INQUIRY_TYPES)[number];

/** Tipos que son cotización (piden empresa y volumen) */
export const isQuote = (t: InquiryType) => t !== "general";

export interface ContactInput {
  type: InquiryType;
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  volume: string;
  message: string;
  locale: string;
}

export class ContactError extends Error {}

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** Valida y normaliza lo que llega del formulario */
export function parseContact(body: unknown): ContactInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const type = INQUIRY_TYPES.includes(b.type as InquiryType)
    ? (b.type as InquiryType)
    : "general";
  const input: ContactInput = {
    type,
    name: str(b.name, 100),
    email: str(b.email, 120),
    phone: str(b.phone, 30),
    company: str(b.company, 120),
    country: str(b.country, 60),
    volume: str(b.volume, 80),
    message: str(b.message, 3000),
    locale: str(b.locale, 5) || "es",
  };
  if (!input.name) throw new ContactError("name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    throw new ContactError("email");
  if (input.phone && !/^[+\d][\d\s()-]{5,}$/.test(input.phone))
    throw new ContactError("phone");
  if (input.message.length < 10) throw new ContactError("message");
  if (b.consent !== true) throw new ContactError("consent");
  return input;
}
