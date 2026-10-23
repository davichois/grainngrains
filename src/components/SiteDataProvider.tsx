"use client";

import { applySiteData, type SiteData } from "@/src/lib/site-data/apply";

/**
 * Aplica en el navegador (y al pre-renderizar) los datos del panel:
 * catálogo, cupones, envíos, contacto, promoción y caficultores. Se hace
 * antes de pintar a los hijos, así todos ven los mismos datos.
 */
export default function SiteDataProvider({
  data,
  children,
}: {
  data: SiteData;
  children: React.ReactNode;
}) {
  applySiteData(data);
  return children;
}
