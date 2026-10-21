/* ───────────────────────────────────────────────────────────────
   Caficultores para la intro de la web: GRAIN & GRAINS se abre y por
   el hueco del "&" pasan sus nombres y su origen.
   Primero van los caficultores reales (REAL_PRODUCERS, con el nombre de
   su campo), en un orden distinto en cada visita; luego, para completar
   el conteo, nombres de referencia (combinaciones de nombres y
   apellidos) de Moyobamba, Lamas, Pinto Recodo y Nuevo Salinas.
   Para sumar caficultores reales, agrégalos a REAL_PRODUCERS.
─────────────────────────────────────────────────────────────── */

export interface ProducerName {
  name: string;
  origin: string;
}

const FIRST_NAMES = [
  "Eliseo",
  "Edwin",
  "Osmar",
  "Rosa",
  "Marleni",
  "Teófilo",
  "Celia",
  "Julián",
  "Juana",
  "Pedro",
  "María",
  "Santos",
  "Elena",
  "Wilmer",
  "Nelly",
  "Segundo",
  "Lucía",
  "Hilario",
  "Fortunata",
  "Alcides",
  "Gladys",
  "Isidro",
  "Yolanda",
  "Víctor",
  "Maribel",
  "Eusebio",
  "Flor",
  "Teodoro",
  "Carmen",
  "Abel",
  "Rocío",
  "Faustino",
  "Delia",
  "Leoncio",
  "Norma",
  "Ezequiel",
  "Sonia",
  "Benigno",
  "Irma",
  "Rubén",
  "Dina",
  "Justino",
  "Elva",
  "Anselmo",
  "Liliana",
  "Odilón",
  "Zoila",
  "Marcelino",
  "Esther",
  "Gregorio",
  "Nora",
  "Amador",
  "Hilda",
  "Severino",
  "Bertha",
  "Ignacio",
  "Feliciana",
  "Leandro",
  "Ana",
  "Wilfredo",
];

const LAST_NAMES = [
  "Quispe",
  "Huamán",
  "Mamani",
  "Flores",
  "Ramos",
  "Chávez",
  "Torres",
  "Vásquez",
  "Rojas",
  "Díaz",
  "Cruz",
  "Mendoza",
  "Sánchez",
  "Huaynate",
  "Cabrera",
  "Tineo",
  "Guevara",
  "Rimarachín",
  "Llanos",
  "Fernández",
  "Campos",
  "Sangama",
  "Tapullima",
  "Pariona",
  "Ccori",
  "Inga",
  "Chuquimango",
  "Bustamante",
  "Rivera",
  "Ñaupari",
  "Yupanqui",
  "Paucar",
  "Saavedra",
  "Delgado",
  "Carrasco",
  "Coronel",
  "Peralta",
  "Tello",
  "Ayala",
  "Huanca",
];

/** Zonas de donde vienen los caficultores (San Martín) */
export const ORIGINS = [
  "Moyobamba, San Martín",
  "Lamas, San Martín",
  "Pinto Recodo, San Martín",
  "Nuevo Salinas, San Martín",
];

/** Generador pseudoaleatorio con semilla: la lista sale siempre igual */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function buildNames(count: number): ProducerName[] {
  const rand = seeded(2026);
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];
  const seen = new Set<string>();
  const out: ProducerName[] = [];
  while (out.length < count) {
    const first = pick(LAST_NAMES);
    const second = pick(LAST_NAMES);
    /* Dos apellidos distintos (nada de "Huamán Huamán") */
    if (first === second) continue;
    const name = `${pick(FIRST_NAMES)} ${first} ${second}`;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, origin: pick(ORIGINS) });
  }
  return out;
}

/** Caficultores reales y su campo (de la lista de campos de café, variedad
 *  Catimor). Sin códigos ni documentos: solo nombre y campo */
export const REAL_PRODUCERS: ProducerName[] = [
  { name: "Wilter Sangama Amasifuen", origin: "Campo Los Reyes" },
  { name: "Guisela Amasifen Sangama", origin: "Campo El Sol" },
  { name: "Marcelita Sangama Sangama", origin: "Campo La Esmeralda" },
  { name: "Wuilson Amasifen Sangama", origin: "Campo La Brisa" },
  { name: "Dany Cachique Sangama", origin: "Campo La Esperanza" },
  { name: "Santos José Cruz Farceque", origin: "Campo Hermelinda" },
  { name: "Abisai Quispe Ruiz", origin: "Campo La Loma" },
  { name: "Edita Becerra Fernández", origin: "Campo El Sauce" },
  { name: "Elio Ved Ruiz Suárez", origin: "Campo Las Ponas" },
  { name: "Estefanía Gonzales Díaz", origin: "Campo Las Flores" },
  { name: "Gloria Elisa Coronel Vásquez", origin: "Campo Mil Amores" },
  { name: "Moisés Becerra Parinango", origin: "Campo El Vencedor" },
  { name: "Luz Leyla Cubas Delgado", origin: "Campo Las Flores" },
  { name: "María Carmi Hoyos Tantalean", origin: "Campo El Cafetal" },
];

const REFERENCE_NAMES = buildNames(1620);

/** Más de 1 500 caficultores: los reales primero (se muestran en la intro) */
export const PRODUCER_NAMES = [...REAL_PRODUCERS, ...REFERENCE_NAMES];

/** La misma lista con los reales en otro orden, para que cada visita
 *  muestre caficultores distintos al inicio */
export function shuffledProducers(): ProducerName[] {
  const real = [...REAL_PRODUCERS];
  for (let i = real.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [real[i], real[j]] = [real[j], real[i]];
  }
  return [...real, ...REFERENCE_NAMES];
}
