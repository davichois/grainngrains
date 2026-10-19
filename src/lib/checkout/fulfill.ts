import "server-only";
import {
  parseCheckoutInput,
  priceOrder,
  type CheckoutInput,
  type PricedOrder,
} from "./order";
import type { MpPayment } from "./mercadopago";
import { sendOrderEmails } from "./email";
import { recordOrderUsage } from "@/src/lib/coupons/usage";

/** Documento del cliente según su comprobante */
export const customerDocument = (input: CheckoutInput) =>
  input.receipt.type === "factura" ? input.receipt.ruc : input.receipt.document;

/**
 * Pago aprobado → correos (alistar en la tienda + confirmación al cliente)
 * y registro de usos de cupones. Seguro de llamar varias veces por pago.
 */
export async function completeOrder(args: {
  input: CheckoutInput;
  priced: PricedOrder;
  orderNumber: string;
  paymentId: string;
}) {
  const { input, priced, orderNumber, paymentId } = args;
  await Promise.all([
    sendOrderEmails({ input, priced, orderNumber, chargeId: paymentId }).catch(
      (e) => console.error("[email]", e),
    ),
    recordOrderUsage({
      paymentId,
      coupons: priced.coupons.map(({ code, discount }) => ({ code, discount })),
      customer: { email: input.customer.email, document: customerDocument(input) },
    }).catch((e) => console.error("[coupons] no se registró el uso", e)),
  ]);
}

/** Igual que completeOrder, reconstruyendo el pedido desde el pago de Mercado Pago */
export async function fulfillPayment(payment: MpPayment) {
  if (payment.status !== "approved" || !payment.id) return;
  const checkout = payment.metadata?.checkout;
  if (typeof checkout !== "string") return;
  const input = parseCheckoutInput(JSON.parse(checkout));
  await completeOrder({
    input,
    /* Con la fecha del pago y sin revisar límites: el cobro ya se hizo */
    priced: priceOrder(input, {
      now: new Date(payment.date_created ?? Date.now()),
    }),
    orderNumber: payment.external_reference ?? "",
    paymentId: String(payment.id),
  });
}
