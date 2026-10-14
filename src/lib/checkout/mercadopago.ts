import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { getTranslations } from "next-intl/server";
import {
  COMBO_CATEGORY,
  comboDetails,
  findCombo,
  findProduct,
} from "@/src/components/product-showcase/data";
import { SITE_URL } from "@/src/lib/site";
import {
  payerIdentification,
  type CheckoutInput,
  type PricedOrder,
} from "./order";

/* Cliente mínimo de la API de pagos de Mercado Pago. El Access Token solo
   vive en el servidor (MP_ACCESS_TOKEN).
   Referencia: https://www.mercadopago.com.pe/developers/es/reference/payments/_payments/post */

const API = "https://api.mercadopago.com";

function accessToken() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MP_ACCESS_TOKEN en las variables de entorno");
  return token;
}

export interface MpPayment {
  id?: number;
  status?: "approved" | "authorized" | "in_process" | "pending" | "rejected" | "cancelled" | "refunded" | "charged_back";
  status_detail?: string;
  external_reference?: string;
  payment_method_id?: string;
  date_created?: string;
  date_approved?: string | null;
  metadata?: Record<string, unknown>;
  /** Solo si el banco pide 3D Secure (status_detail "pending_challenge") */
  three_ds_info?: { external_resource_url?: string; creq?: string };
  message?: string;
  cause?: { code?: number | string; description?: string }[];
}

async function request(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as MpPayment;
  return { status: res.status, data };
}

/** URL pública para las notificaciones (solo si el sitio está en https) */
function notificationUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site?.startsWith("https://")) return undefined;
  return `${site.replace(/\/$/, "")}/api/checkout/webhook?source_news=webhooks`;
}

/**
 * Crea el pago con el token de tarjeta o de Yape. El monto sale del pedido
 * recalculado en el servidor. El pedido completo viaja en `metadata` para
 * que el webhook pueda enviar los correos si el pago se aprueba más tarde.
 */
export async function createPayment(args: {
  input: CheckoutInput;
  priced: PricedOrder;
  orderNumber: string;
  token: string;
  paymentMethodId: string;
  issuerId?: number;
  /** Device ID del script antifraude (window.MP_DEVICE_SESSION_ID) */
  deviceId?: string;
}) {
  const { input, priced, orderNumber } = args;
  const c = input.customer;
  const a = input.address;
  const t = await getTranslations({ locale: "es" });
  /* Productos con nombre real, detalle e imagen: el antifraude aprueba
     más cuando el pedido se describe completo */
  const items = priced.lines.map((l) => {
    const combo =
      l.categoryId === COMBO_CATEGORY ? findCombo(l.productId) : undefined;
    const image = combo
      ? comboDetails(combo).products[0]?.product.image
      : findProduct(l.categoryId, l.productId)?.image;
    return {
      id: `${l.categoryId}.${l.productId}.${l.size}.${l.grind}`,
      title: combo
        ? t(`cart.combos.${l.productId}.name`)
        : t(`editions.${l.categoryId}.products.${l.productId}`),
      description: `Café ${t(`shop.sizes.${l.size}`)} · ${t(`shop.grinds.${l.grind}`)}`,
      category_id: "food",
      quantity: l.qty,
      unit_price: l.unitPrice,
      ...(image && { picture_url: new URL(image, SITE_URL).toString() }),
    };
  });
  return request("/v1/payments", {
    method: "POST",
    headers: {
      /* Evita cobrar dos veces si la petición se repite */
      "X-Idempotency-Key": randomUUID(),
      ...(args.deviceId && { "X-meli-session-id": args.deviceId }),
    },
    body: JSON.stringify({
      transaction_amount: priced.total,
      token: args.token,
      description: `Pedido ${orderNumber} · Grain & Grains`,
      /* Siempre en un solo pago, sin cuotas */
      installments: 1,
      payment_method_id: args.paymentMethodId,
      ...(args.issuerId && { issuer_id: args.issuerId }),
      external_reference: orderNumber,
      /* 3D Secure: si el antifraude duda, el banco pide confirmar al cliente
         en vez de rechazar. Requiere captura inmediata y sin modo binario */
      ...(args.paymentMethodId !== "yape" && {
        three_d_secure_mode: "optional",
        capture: true,
        binary_mode: false,
      }),
      statement_descriptor: "GRAINNGRAINS",
      notification_url: notificationUrl(),
      payer: {
        email: c.email,
        first_name: c.firstName,
        last_name: c.lastName,
        identification: payerIdentification(input.receipt),
      },
      /* Datos para el antifraude de Mercado Pago: más datos, menos rechazos */
      additional_info: {
        items,
        payer: {
          first_name: c.firstName,
          last_name: c.lastName,
          phone: { area_code: "51", number: c.phone },
          address: { street_name: a.address.slice(0, 100) },
        },
        shipments: {
          receiver_address: {
            street_name: a.address.slice(0, 100),
            city_name: a.province,
            state_name: a.department,
          },
        },
      },
      metadata: { order_number: orderNumber, checkout: JSON.stringify(input) },
    }),
  });
}

export function getPayment(id: string) {
  return request(`/v1/payments/${encodeURIComponent(id)}`);
}

/**
 * Verifica la firma `x-signature` de un webhook (HMAC-SHA256 con la clave
 * secreta de Webhooks). Si no hay clave configurada devuelve true: el
 * webhook igual consulta el pago a la API antes de hacer nada.
 */
export function verifyWebhookSignature(req: {
  signature: string | null;
  requestId: string | null;
  dataId: string;
}) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!req.signature) return false;
  const parts = Object.fromEntries(
    req.signature.split(",").map((p) => p.trim().split("=") as [string, string]),
  );
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${req.dataId.toLowerCase()};${req.requestId ? `request-id:${req.requestId};` : ""}ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Motivo de rechazo (status_detail) → código de mensaje del checkout */
export function rejectionReason(detail: string | undefined, wallet: boolean) {
  switch (detail) {
    case "cc_rejected_insufficient_amount":
      return "insufficient_funds";
    case "cc_rejected_bad_filled_card_number":
    case "cc_rejected_bad_filled_date":
    case "cc_rejected_bad_filled_security_code":
    case "cc_rejected_bad_filled_other":
    case "cc_rejected_form_error":
      return wallet ? "yape_check" : "check_card_data";
    case "cc_rejected_call_for_authorize":
    case "cc_rejected_card_disabled":
      return "call_bank";
    case "cc_amount_rate_limit_exceeded":
      return wallet ? "yape_limit_exceeded" : "call_bank";
    case "cc_rejected_3ds_challenge":
      return "challenge_failed";
    case "cc_rejected_high_risk":
    case "cc_rejected_blacklist":
      return "high_risk";
    case "cc_rejected_max_attempts":
      return "max_attempts";
    case "cc_rejected_duplicated_payment":
      return "duplicated";
    case "cc_rejected_card_type_not_allowed":
    case "cc_unsupported_unsupported":
      return "card_not_allowed";
    default:
      return "failed";
  }
}
