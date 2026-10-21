import { notFound } from "next/navigation";

/* Atrapa cualquier dirección que no existe dentro de un idioma
   (/es/lo-que-sea) y muestra la 404 propia ([locale]/not-found.tsx) */
export default function CatchAll() {
  notFound();
}
