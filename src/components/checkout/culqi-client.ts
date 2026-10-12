"use client";

/* Integración de Culqi en el navegador:
   - Culqi Checkout Custom (https://js.culqi.com/checkout-js): ventana segura
     de Culqi donde se ingresan tarjeta o Yape (sin requisitos PCI extra para
     el comercio); devuelve un token que se cobra en el servidor.
   - Culqi 3DS (https://3ds.culqi.com): huella del dispositivo (antifraude) y
     autenticación del banco cuando el cargo la pide. */

const CHECKOUT_JS = "https://js.culqi.com/checkout-js";
const CULQI_3DS_JS = "https://3ds.culqi.com";

interface CulqiInstance {
  open: () => void;
  close: () => void;
  culqi: () => void;
  token?: { id: string; email?: string };
  order?: unknown;
  error?: { user_message?: string; merchant_message?: string };
}

interface Culqi3DSApi {
  publicKey: string;
  options: Record<string, unknown>;
  settings: Record<string, unknown>;
  generateDevice: () => Promise<string>;
  initAuthentication: (tokenId: string) => void;
  reset: () => void;
}

declare global {
  interface Window {
    CulqiCheckout?: new (
      publicKey: string,
      config: Record<string, unknown>,
    ) => CulqiInstance;
    Culqi3DS?: Culqi3DSApi;
  }
}

const loaded = new Map<string, Promise<void>>();

function loadScript(src: string) {
  if (!loaded.has(src)) {
    loaded.set(
      src,
      new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => {
          loaded.delete(src);
          reject(new Error("culqi_unavailable"));
        };
        document.head.appendChild(s);
      }),
    );
  }
  return loaded.get(src)!;
}

/** Carga los scripts de Culqi y devuelve el id de dispositivo (antifraude) */
export async function prepareCulqi(publicKey: string) {
  await Promise.all([loadScript(CHECKOUT_JS), loadScript(CULQI_3DS_JS)]);
  const c3ds = window.Culqi3DS;
  if (!window.CulqiCheckout || !c3ds) throw new Error("culqi_unavailable");
  c3ds.publicKey = publicKey;
  c3ds.options = { showModal: true, showLoading: true, showIcon: true };
  return c3ds.generateDevice().catch(() => "");
}

/**
 * Abre la ventana (modal) de Culqi; resuelve con el token o rechaza con el
 * mensaje de Culqi. Si el cliente la cierra sin pagar, la promesa queda
 * pendiente y el checkout vuelve a estar disponible.
 */
export function openCulqiCheckout({
  publicKey,
  amountCents,
  orderId,
  method,
  customer,
}: {
  publicKey: string;
  amountCents: number;
  orderId?: string;
  method: "wallet" | "card";
  customer: { email: string; firstName: string; lastName: string };
}) {
  return new Promise<string>((resolve, reject) => {
    const paymentMethods = {
      tarjeta: method === "card",
      yape: method === "wallet",
      billetera: false,
      bancaMovil: false,
      agente: false,
      cuotealo: false,
    };
    const culqi = new window.CulqiCheckout!(publicKey, {
      settings: {
        title: "Grain & Grains",
        currency: "PEN",
        amount: amountCents,
        ...(orderId && { order: orderId }),
      },
      client: customer,
      options: {
        lang: "auto",
        installments: false,
        modal: true,
        paymentMethods,
        paymentMethodsSort: Object.keys(paymentMethods),
      },
      appearance: {
        theme: "default",
        menuType: "sidebar",
        /* Culqi agrega el monto al texto del botón: solo "Pagar" */
        buttonCardPayText: "Pagar",
        logo: `${window.location.origin}/icon-192.png`,
        defaultStyle: {
          bannerColor: "#116e78",
          buttonBackground: "#111827",
          menuColor: "#116e78",
          linksColor: "#116e78",
          buttonTextColor: "#ffffff",
          priceColor: "#111827",
        },
      },
    });
    culqi.culqi = () => {
      if (culqi.token) {
        culqi.close();
        resolve(culqi.token.id);
      } else if (culqi.error) {
        reject(new Error(culqi.error.user_message || "payment_error"));
      }
    };
    culqi.open();
  });
}

/** Autenticación 3DS; resuelve con los parámetros para repetir el cargo */
export function authenticate3DS({
  tokenId,
  amountCents,
  email,
}: {
  tokenId: string;
  amountCents: number;
  email: string;
}) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const c3ds = window.Culqi3DS!;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const { parameters3DS, error } = (event.data ?? {}) as {
        parameters3DS?: Record<string, unknown>;
        error?: unknown;
      };
      if (!parameters3DS && !error) return;
      window.removeEventListener("message", onMessage);
      if (parameters3DS) resolve(parameters3DS);
      else reject(new Error("3ds_failed"));
    };
    window.addEventListener("message", onMessage);
    c3ds.settings = {
      charge: { totalAmount: amountCents, returnUrl: window.location.href },
      card: { email },
    };
    c3ds.initAuthentication(tokenId);
  });
}

export function reset3DS() {
  window.Culqi3DS?.reset();
}
