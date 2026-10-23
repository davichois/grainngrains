"use server";

import { redirect } from "next/navigation";
import { login } from "@/src/lib/admin/auth";

export type LoginState = { error?: string } | undefined;

/** Solo rutas del panel (evita redirigir a otra web) */
const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/admin") && !s.startsWith("//") ? s : "/admin";
};

export async function loginAction(
  _prev: LoginState,
  form: FormData,
): Promise<LoginState> {
  const username = String(form.get("username") ?? "").slice(0, 100);
  const password = String(form.get("password") ?? "").slice(0, 200);
  const result = await login(username, password);
  if (!result.ok) {
    if (result.error === "config")
      return {
        error:
          "El panel aún no está configurado: faltan ADMIN_USERNAME, ADMIN_PASSWORD_HASH o ADMIN_SESSION_SECRET en el .env.",
      };
    if (result.error === "locked")
      return {
        error: `Demasiados intentos. Vuelve a intentarlo en ${result.minutes} min.`,
      };
    return { error: "Usuario o contraseña incorrectos." };
  }
  redirect(safeNext(form.get("next")));
}
