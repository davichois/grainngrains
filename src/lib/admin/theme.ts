/** Tema del panel elegido en el menú (cookie). Sin cookie = el del sistema */
export const THEME_COOKIE = "gg_admin_theme";
export type AdminTheme = "system" | "light" | "dark";
export const readTheme = (v?: string): AdminTheme =>
  v === "light" || v === "dark" ? v : "system";

/** Tamaño de letra del panel: pequeña (un poco menor), mediana (normal) o grande */
export const TEXT_COOKIE = "gg_admin_text";
export type AdminTextSize = "sm" | "md" | "lg";
export const readTextSize = (v?: string): AdminTextSize =>
  v === "sm" || v === "lg" ? v : "md";
