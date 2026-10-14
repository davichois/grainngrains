import "server-only";
import { parseCheckoutInput, priceOrder } from "./order";
import type { MpPayment } from "./mercadopago";
import { sendOrderEmails } from "./email";

/**
 * Pago aprobado → correos del pedido (alistar en la tienda + confirmación al
 * cliente). El pedido se reconstruye desde `metadata.checkout`, que se guardó
 * al crear el pago. Es seguro llamarlo más de una vez para el mismo pago.
 */
export async function fulfillPayment(payment: MpPayment) {
  if (payment.status !== "approved" || !payment.id) return;
  const checkout = payment.metadata?.checkout;
  if (typeof checkout !== "string") return;
  const input = parseCheckoutInput(JSON.parse(checkout));
  await sendOrderEmails({
    input,
    priced: priceOrder(input),
    orderNumber: payment.external_reference ?? "",
    chargeId: String(payment.id),
  });
}
