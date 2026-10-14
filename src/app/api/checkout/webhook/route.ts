import { parseCheckoutInput, priceOrder } from "@/src/lib/checkout/order";
import {
  getPayment,
  verifyWebhookSignature,
} from "@/src/lib/checkout/mercadopago";
import { sendOrderEmails } from "@/src/lib/checkout/email";

/* Webhook de Mercado Pago: avisa cuando un pago cambia de estado. Se usa
   para los pagos que quedaron "en revisión" y se aprueban después: en ese
   momento se envían los correos del pedido. Los pagos aprobados al instante
   ya enviaron sus correos en /api/checkout/charge. */

/** Si se aprobó después de este tiempo, el pago pasó por revisión */
const REVIEW_THRESHOLD_MS = 60_000;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as {
    type?: string;
    data?: { id?: string | number };
  };
  const type = url.searchParams.get("type") ?? body.type;
  const dataId = url.searchParams.get("data.id") ?? String(body.data?.id ?? "");
  if (type !== "payment" || !/^\d+$/.test(dataId)) {
    return new Response(null, { status: 200 });
  }

  if (
    !verifyWebhookSignature({
      signature: request.headers.get("x-signature"),
      requestId: request.headers.get("x-request-id"),
      dataId,
    })
  ) {
    return new Response(null, { status: 401 });
  }

  try {
    /* Nunca se confía en el cuerpo: el estado real se consulta a la API */
    const { status, data: payment } = await getPayment(dataId);
    if (status !== 200 || payment.status !== "approved") {
      return new Response(null, { status: 200 });
    }

    const created = Date.parse(payment.date_created ?? "");
    const approved = Date.parse(payment.date_approved ?? "");
    const wasReviewed = approved - created > REVIEW_THRESHOLD_MS;
    const checkout = payment.metadata?.checkout;
    if (wasReviewed && typeof checkout === "string") {
      const input = parseCheckoutInput(JSON.parse(checkout));
      await sendOrderEmails({
        input,
        priced: priceOrder(input),
        orderNumber: payment.external_reference ?? "",
        chargeId: String(payment.id),
      });
    }
  } catch (e) {
    console.error("[checkout/webhook]", e);
    /* 500 → Mercado Pago reintenta la notificación más tarde */
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 200 });
}
