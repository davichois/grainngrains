/* ───────────────────────────────────────────────────────────────
   Paletas de la intro, sacadas de las latas de cada café: el fondo es
   el color con el que se fotografía cada lata y las letras y el acento
   salen de la lata misma (cuerpo, retrato, frutos, flores…).
   Cada vez que se entra a la web se elige una al azar, evitando las
   últimas que se vieron (ver pickIntroPalette).
─────────────────────────────────────────────────────────────── */

export interface IntroPalette {
  /** Café del que sale (id del producto en product-showcase/data.ts) */
  id: string;
  /** Fondo de la intro */
  bg: string;
  /** Letras: las G, los nombres, el dominio y la frase final */
  ink: string;
  /** Acento: el "&", el número del contador y la barra de avance */
  accent: string;
}

export const INTRO_PALETTES: IntroPalette[] = [
  /* Finca Don Eliseo: oliva, lata negra y retrato verde claro */
  { id: "donEliseoFarm", bg: "#AAAD01", ink: "#1F1F1C", accent: "#F3F7E6" },
  /* Finca Don Edwin: naranja, lata negra y retrato en tonos piel */
  { id: "donEdwinFarm", bg: "#DF7B00", ink: "#282829", accent: "#FFF1E2" },
  /* Finca Don Osmar: carmesí y retrato salmón */
  { id: "donOsmarFarm", bg: "#A70E2D", ink: "#FBE9E4", accent: "#F4A497" },
  /* Hijas del Bosque: fucsia de la marca (#FF0064, el de la edición
     mujeres), letras rosa muy claro y el rosa de la lata como acento */
  {
    id: "daughtersOfTheForest",
    bg: "#FF0064",
    ink: "#FFF0F6",
    accent: "#FCBCDD",
  },
  /* Guardianas de la Tierra: rojo con crema y vino oscuro */
  {
    id: "guardiansOfTheEarth",
    bg: "#ED2738",
    ink: "#FFF3EC",
    accent: "#3B0B10",
  },
  /* Clásico de la Mañana: crema, letras verde azulado y frutos rojos */
  { id: "morningClassic", bg: "#FCDD81", ink: "#1E4E4B", accent: "#D2502E" },
  /* Vainilla: amarillo, café tostado y cereza roja */
  { id: "vanilla-infused", bg: "#FFCF02", ink: "#3A2A0E", accent: "#B4441E" },
  /* Guanábana: verde, hoja oscura y pulpa crema */
  {
    id: "guanabana-infused",
    bg: "#75AC57",
    ink: "#16290E",
    accent: "#F6F3E4",
  },
];

/** Mientras se elige la paleta (antes de hidratar): neutra y oscura */
export const INTRO_DEFAULT_PALETTE: IntroPalette = {
  id: "default",
  bg: "#141414",
  ink: "#FFFFFF",
  accent: "#FFFFFF",
};

const STORAGE_KEY = "gg-intro-palettes";
/** Cuántas de las últimas paletas no se repiten */
const AVOID_LAST = 3;

/** Elige una paleta al azar que no sea ninguna de las últimas vistas */
export function pickIntroPalette(): IntroPalette {
  let recent: string[] = [];
  try {
    recent = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(recent)) recent = [];
  } catch {
    /* sin almacenamiento: cualquiera vale */
  }
  const options = INTRO_PALETTES.filter((p) => !recent.includes(p.id));
  const pool = options.length ? options : INTRO_PALETTES;
  const palette = pool[Math.floor(Math.random() * pool.length)];
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([palette.id, ...recent].slice(0, AVOID_LAST)),
    );
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
  return palette;
}
