import "server-only";

/* Cliente mínimo de la API REST de Culqi (v2). La llave secreta solo vive
   en el servidor (CULQI_SECRET_KEY). Referencia: https://apidocs.culqi.com */

const API = "https://api.culqi.com/v2";

function secretKey() {
  const key = process.env.CULQI_SECRET_KEY;
  if (!key)
    throw new Error("Falta CULQI_SECRET_KEY en las variables de entorno");
  return key;
}

export interface CulqiResponse<T = Record<string, unknown>> {
  status: number;
  data: T & {
    object?: string;
    id?: string;
    action_code?: string;
    user_message?: string;
    merchant_message?: string;
  };
}

async function post<T>(path: string, body: unknown): Promise<CulqiResponse<T>> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    /* Mismas cabeceras que los SDK oficiales de Culqi */
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-culqi-env": secretKey().includes("test") ? "test" : "live",
      "x-api-version": "2",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

/** Orden: el checkout de Culqi la necesita para ofrecer Yape (expira en 24 h) */
export function createOrder(input: {
  amountCents: number;
  orderNumber: string;
  description: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}) {
  return post("/orders", {
    amount: input.amountCents,
    currency_code: "PEN",
    description: input.description.slice(0, 80),
    order_number: input.orderNumber,
    client_details: {
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone_number: input.phone,
    },
    expiration_date: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    confirm: false,
  });
}

/**
 * Cargo con el token de tarjeta o Yape.
 * - 201: cobrado.
 * - 200 con action_code "REVIEW": el banco pide 3DS; se repite el cargo
 *   con `authentication3DS` tras la autenticación en el navegador.
 */
export function createCharge(input: {
  amountCents: number;
  email: string;
  tokenId: string;
  description: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  deviceId?: string;
  authentication3DS?: Record<string, unknown>;
}) {
  return post("/charges", {
    amount: input.amountCents,
    currency_code: "PEN",
    email: input.email,
    source_id: input.tokenId,
    description: input.description.slice(0, 80),
    metadata: { order_number: input.orderNumber },
    antifraud_details: {
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone_number: input.phone,
      address: input.address.slice(0, 100),
      address_city: input.city.slice(0, 30),
      country_code: "PE",
      ...(input.deviceId && { device_finger_print_id: input.deviceId }),
    },
    ...(input.authentication3DS && {
      authentication_3DS: input.authentication3DS,
    }),
  });
}
