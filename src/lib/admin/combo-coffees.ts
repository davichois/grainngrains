import "server-only";
import type { EditionView } from "./queries";
import { LOCALES, LOCALE_NAMES } from "./texts";

/** Cafés que se pueden poner en un combo (250 g), para el formulario */
export const comboCoffees = (editions: EditionView[]) =>
  editions.flatMap((e) =>
    e.products.map((p) => ({
      value: `${e.id}/${p.id}`,
      name: p.name,
      edition: e.name,
      /* Precio por presentación (solo las que tienen precio) */
      prices: Object.fromEntries(Object.entries(p.prices).filter(([, v]) => Number(v) > 0)) as Record<string, number>,
      image: p.image,
      cardBg: p.cardBg,
      active: p.active && e.active,
    })),
  );

export const localeOptions = () => LOCALES.map((id) => ({ id, name: LOCALE_NAMES[id] }));
