// Datos no traducibles del lote. Los textos (etiquetas, perfil sensorial, etc.)
// viven en messages/*.json bajo la clave "traceability".
export type TraceRecordMeta = {
  code: string;
  coffeeFarm: string;
  origin: string;
  altitude: string;
  variety: string;
};

// Clave normalizada (solo alfanumérico en mayúsculas)
export const RECORDS: Record<string, TraceRecordMeta> = {
  GG691445: {
    code: "GG - 691445",
    coffeeFarm: "Cooperativa CAFCER",
    origin: "Moyobamba, San Martín, Perú",
    altitude: "1250 msnm",
    variety: "Blend (Catimor, Caturra, Marsellesa, Obata Tupy)",
  },
  GG559011: {
    code: "GG - 559011",
    coffeeFarm: "Mr. Osmar",
    origin: "Moyobamba, San Martín, Perú",
    altitude: "1250 msnm",
    variety: "Castilla",
  },
  GG253031: {
    code: "GG - 253031",
    coffeeFarm: "Mr. Eliseo",
    origin: "Moyobamba, San Martín, Perú",
    altitude: "1250 msnm",
    variety: "Pacamara",
  },
  GG288501: {
    code: "GG - 288501",
    coffeeFarm: "Mr. Edwin",
    origin: "Moyobamba, San Martín, Perú",
    altitude: "1250 msnm",
    variety: "Obata",
  },
};

export const normalizeCode = (raw: string) =>
  raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
