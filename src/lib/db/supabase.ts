import "server-only";

/* ───────────────────────────────────────────────────────────────
   Conexión con Supabase por su API REST (PostgREST), solo en el servidor
   y con la clave service_role. Las tablas tienen RLS sin políticas: desde
   el navegador nadie puede leerlas ni escribirlas.
   Si faltan las variables, `dbReady()` es false y la web usa los datos
   del código (nada se rompe).
─────────────────────────────────────────────────────────────── */

const url = () => process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

export const dbReady = () => Boolean(url() && key());

/** Etiqueta de caché de todo lo que la web pública lee de la base */
export const SITE_DATA_TAG = "site-data";

export class DbError extends Error {}

type Cache =
  /** Para la web pública: guardada en caché hasta que el panel la invalide */
  | { tags: string[]; revalidate?: number }
  /** Para el panel: siempre fresca */
  | "no-store";

async function call<T>(
  path: string,
  init: RequestInit & { cacheMode?: Cache; prefer?: string } = {},
): Promise<T> {
  if (!dbReady()) throw new DbError("db_not_configured");
  const { cacheMode = "no-store", prefer, ...rest } = init;
  const res = await fetch(`${url()}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: key()!,
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
      ...(prefer && { Prefer: prefer }),
      ...rest.headers,
    },
    ...(cacheMode === "no-store"
      ? { cache: "no-store" as const }
      : {
          cache: "force-cache" as const,
          next: {
            tags: cacheMode.tags,
            revalidate: cacheMode.revalidate ?? 3600,
          },
        }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new DbError(`${res.status} ${path.split("?")[0]}: ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Filtro PostgREST: { id: "eq.123", status: "in.(paid,shipped)" } */
type Query = Record<string, string | number | boolean | undefined>;
const qs = (q: Query = {}) =>
  Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

export const db = {
  select<T>(table: string, query: Query = {}, cacheMode: Cache = "no-store") {
    return call<T[]>(`${table}?${qs({ select: "*", ...query })}`, { cacheMode });
  },
  /** Una fila o null */
  async one<T>(table: string, query: Query) {
    const rows = await call<T[]>(`${table}?${qs({ select: "*", ...query, limit: 1 })}`);
    return rows[0] ?? null;
  },
  insert<T>(table: string, rows: object | object[]) {
    return call<T[]>(table, {
      method: "POST",
      body: JSON.stringify(rows),
      prefer: "return=representation",
    });
  },
  /** Inserta o actualiza según la clave primaria (o `onConflict`) */
  upsert<T>(table: string, rows: object | object[], onConflict?: string) {
    return call<T[]>(`${table}${onConflict ? `?on_conflict=${onConflict}` : ""}`, {
      method: "POST",
      body: JSON.stringify(rows),
      prefer: "resolution=merge-duplicates,return=representation",
    });
  },
  update<T>(table: string, match: Query, data: object) {
    return call<T[]>(`${table}?${qs(match)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      prefer: "return=representation",
    });
  },
  remove(table: string, match: Query) {
    return call<void>(`${table}?${qs(match)}`, { method: "DELETE" });
  },
  rpc<T>(fn: string, args: object) {
    return call<T>(`rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });
  },
};
