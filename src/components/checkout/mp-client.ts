/* ───────────────────────────────────────────────────────────────
   Mercado Pago en el navegador (MercadoPago.js v2).
   - Tarjeta: "Secure Fields": cada dato sensible vive en un iframe de
     Mercado Pago dibujado dentro de nuestros propios campos, así que la
     tarjeta nunca toca este sitio (sin cuestionario PCI).
   - Yape: celular + código de aprobación → token.
   Referencia: https://www.mercadopago.com.pe/developers/es/docs/checkout-api-payments
─────────────────────────────────────────────────────────────── */

const SDK_URL = "https://sdk.mercadopago.com/js/v2";

export type SecureFieldType = "cardNumber" | "expirationDate" | "securityCode";

export interface SecureField {
  mount(containerId: string): SecureField;
  unmount(): void;
  update(props: Record<string, unknown>): SecureField;
  on(event: string, cb: (data: Record<string, unknown>) => void): SecureField;
}

export interface PaymentMethodInfo {
  id: string;
  payment_type_id: string;
  name: string;
  secure_thumbnail?: string;
  additional_info_needed?: string[];
  issuer?: { id: number; name: string };
  settings?: {
    card_number?: { length: number; validation: string };
    security_code?: { length: number; mode: string };
  }[];
}

interface MercadoPagoInstance {
  fields: {
    create(type: SecureFieldType, options: Record<string, unknown>): SecureField;
    createCardToken(data: {
      cardholderName?: string;
      identificationType?: string;
      identificationNumber?: string;
    }): Promise<{ id: string } | undefined>;
  };
  getPaymentMethods(q: { bin: string }): Promise<{ results: PaymentMethodInfo[] }>;
  getIssuers(q: {
    paymentMethodId: string;
    bin: string;
  }): Promise<{ id: number; name: string }[]>;
  yape(opts: { otp: string; phoneNumber: string }): {
    create(): Promise<{ id: string }>;
  };
}

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      opts?: { locale?: string },
    ) => MercadoPagoInstance;
  }
}

let sdk: Promise<void> | null = null;
let instance: MercadoPagoInstance | null = null;

function loadSdk() {
  if (window.MercadoPago) return Promise.resolve();
  sdk ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      sdk = null;
      s.remove();
      reject(new Error("mp_unavailable"));
    };
    document.head.appendChild(s);
  });
  return sdk;
}

/** Instancia única de MercadoPago (carga el SDK la primera vez) */
export async function getMercadoPago() {
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
  if (!publicKey) throw new Error("config");
  if (instance) return instance;
  await loadSdk();
  if (!window.MercadoPago) throw new Error("mp_unavailable");
  instance = new window.MercadoPago(publicKey, { locale: "es-PE" });
  return instance;
}

/** Token de Yape con el celular y el código de aprobación de la app */
export async function createYapeToken(phoneNumber: string, otp: string) {
  const mp = await getMercadoPago();
  try {
    const token = await mp.yape({ phoneNumber, otp }).create();
    if (!token?.id) throw new Error();
    return token.id;
  } catch {
    throw new Error("yape_token");
  }
}
