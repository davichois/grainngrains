import "server-only";
import { scrypt, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_TTL_S,
  signSession,
  verifySession,
} from "./session";

/* ───────────────────────────────────────────────────────────────
   Acceso al panel: un solo usuario administrador definido en el .env
   (ADMIN_USERNAME y ADMIN_PASSWORD_HASH). La contraseña nunca se guarda
   en texto plano: se compara contra un hash scrypt.
   - 5 intentos fallidos por IP → 15 minutos bloqueado.
   - Sesión de 8 h en una cookie httpOnly, firmada y solo para /admin.
─────────────────────────────────────────────────────────────── */

const scryptAsync = (password: string, salt: Buffer, keylen: number) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, keylen, { N: 16384, r: 8, p: 1 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );

/** "scrypt:<sal en base64>:<hash en base64>" (ver npm run admin:password).
 *  Sin "$": Next lo leería como una variable dentro del .env */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt:${salt.toString("base64")}:${key.toString("base64")}`;
}

async function passwordMatches(password: string, stored: string) {
  const [algo, saltB64, hashB64] = stored.split(":");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** ¿Está todo configurado para poder entrar? */
export const authConfigured = () =>
  Boolean(
    process.env.ADMIN_USERNAME &&
      process.env.ADMIN_PASSWORD_HASH &&
      (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32,
  );

/* Intentos fallidos por IP (en memoria del servidor) */
const attempts = new Map<string, { fails: number; until: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export type LoginResult =
  | { ok: true }
  | { ok: false; error: "config" | "invalid" | "locked"; minutes?: number };

export async function login(username: string, password: string): Promise<LoginResult> {
  if (!authConfigured()) return { ok: false, error: "config" };
  const ip = await clientIp();
  const now = Date.now();
  const a = attempts.get(ip);
  if (a && a.until > now) {
    return { ok: false, error: "locked", minutes: Math.ceil((a.until - now) / 60000) };
  }

  /* Se revisan los dos datos siempre (mismo tiempo aunque el usuario no exista) */
  const userOk =
    username.length === process.env.ADMIN_USERNAME!.length &&
    timingSafeEqual(Buffer.from(username), Buffer.from(process.env.ADMIN_USERNAME!));
  const passOk = await passwordMatches(password, process.env.ADMIN_PASSWORD_HASH!);

  if (!userOk || !passOk) {
    const fails = (a && a.until <= now && a.fails >= MAX_FAILS ? 0 : (a?.fails ?? 0)) + 1;
    attempts.set(ip, { fails, until: fails >= MAX_FAILS ? now + LOCK_MS : 0 });
    /* Pequeña espera: frena los intentos automáticos */
    await new Promise((r) => setTimeout(r, 600));
    return fails >= MAX_FAILS
      ? { ok: false, error: "locked", minutes: LOCK_MS / 60000 }
      : { ok: false, error: "invalid" };
  }

  attempts.delete(ip);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_TTL_S,
  });
  return { ok: true };
}

export async function logout() {
  (await cookies()).set(SESSION_COOKIE, "", { path: "/admin", maxAge: 0 });
}

/** La sesión actual o null */
export async function currentSession() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/**
 * Exige sesión. Se llama al inicio de CADA página y acción del panel
 * (además del proxy): las acciones del servidor se pueden invocar
 * directamente, así que cada una se protege por sí misma.
 */
export async function requireAdmin() {
  const session = await currentSession();
  if (!session) redirect("/admin/login");
  return session;
}
