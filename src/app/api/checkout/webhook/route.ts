import {
  getPayment,
  verifyWebhookSignature,
} from "@/src/lib/checkout/mercadopago";
import { fulfillPayment } from "@/src/lib/checkout/fulfill";

/* Webhook de Mercado Pago: avisa cuando un pago cambia de estado. Si quedó
   aprobado se envían los correos del pedido. Cubre los pagos que se aprueban
   después (revisión, 3D Secure con el navegador cerrado); si ya se enviaron
   en el cobro, la idempotencia de Resend evita duplicarlos. */

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
    if (status === 200) await fulfillPayment(payment);
  } catch (e) {
    console.error("[checkout/webhook]", e);
    /* 500 → Mercado Pago reintenta la notificación más tarde */
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 200 });
}
