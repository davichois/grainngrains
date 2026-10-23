/* ───────────────────────────────────────────────────────────────
   Sesión del panel: token firmado con HMAC-SHA256 (ADMIN_SESSION_SECRET)
   que viaja en una cookie httpOnly. Usa solo Web Crypto, así funciona en
   el proxy y en el servidor.
─────────────────────────────────────────────────────────────── */

export const SESSION_COOKIE = "gg_admin";
/** Duración de la sesión: 8 horas */
export const SESSION_TTL_S = 8 * 60 * 60;

const enc = new TextEncoder();

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromB64url = (s: string) =>
  Uint8Array.from(
    atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)),
    (c) => c.charCodeAt(0),
  );

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET ?? "";
  /* Sin una clave larga no se firma nada (el panel queda cerrado) */
  return s.length >= 32 ? s : null;
}

async function hmac(data: string, key: string) {
  const k = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}

/** Comparación en tiempo constante */
function same(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export interface Session {
  u: string;
  /** Vence (segundos desde 1970) */
  exp: number;
}

export async function signSession(user: string) {
  const key = secret();
  if (!key) throw new Error("ADMIN_SESSION_SECRET falta o es muy corta");
  const payload: Session = {
    u: user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S,
  };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  return `${body}.${b64url(await hmac(body, key))}`;
}

export async function verifySession(token: string | undefined) {
  const key = secret();
  if (!key || !token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    if (!same(fromB64url(sig), await hmac(body, key))) return null;
    const session = JSON.parse(new TextDecoder().decode(fromB64url(body))) as Session;
    if (
      typeof session.exp !== "number" ||
      session.exp < Date.now() / 1000 ||
      session.u !== process.env.ADMIN_USERNAME
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
