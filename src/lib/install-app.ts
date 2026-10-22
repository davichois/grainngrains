"use client";

import { useSyncExternalStore } from "react";

/* ───────────────────────────────────────────────────────────────
   Instalar la web como app (PWA). Un solo lugar escucha al navegador y
   lo comparten el botón lateral (computadora) y el menú (celular).
   - "prompt": Chrome/Edge/Android permiten instalar con un botón.
   - "ios": iPhone/iPad en Safari; solo se puede con Compartir → Agregar a
     inicio, así que se muestran los pasos.
   - "hidden": ya está instalada, se está dentro de la app o el navegador
     no permite instalar.
─────────────────────────────────────────────────────────────── */

/** Evento que da Chrome/Edge/Android cuando la web se puede instalar */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallMode = "hidden" | "prompt" | "ios";
interface InstallState {
  mode: InstallMode;
  /** Se acaba de instalar (para el aviso de "¡Listo!") */
  done: boolean;
}

const HIDDEN: InstallState = { mode: "hidden", done: false };
let state: InstallState = HIDDEN;
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const set = (next: Partial<InstallState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

/* Se escucha apenas carga el código (el aviso del navegador puede llegar
   antes de que React termine de montar) */
if (typeof window !== "undefined") {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (!standalone) {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault(); // se ofrece con nuestro botón, no con el del navegador
      deferred = e as BeforeInstallPromptEvent;
      set({ mode: "prompt" });
    });
    window.addEventListener("appinstalled", () => {
      deferred = null;
      set({ mode: "hidden", done: true });
      setTimeout(() => set({ done: false }), 5000);
    });
    const ua = navigator.userAgent;
    const ios =
      /iphone|ipad|ipod/i.test(ua) ||
      (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    const safari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    if (ios && safari) state = { ...state, mode: "ios" };
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Abre la instalación del navegador ("prompt"); en iPhone no hace nada
 *  (la interfaz muestra los pasos) */
export async function installApp() {
  if (!deferred) return;
  const e = deferred;
  /* El aviso del navegador solo se puede usar una vez */
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === "accepted") set({ mode: "hidden" });
}

export function useInstallApp() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => HIDDEN,
  );
}
