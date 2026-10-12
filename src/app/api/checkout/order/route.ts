import {
  OrderError,
  YAPE_MAX,
  newOrderNumber,
  parseCheckoutInput,
  priceOrder,
} from "@/src/lib/checkout/order";
import { createOrder } from "@/src/lib/checkout/culqi";

/* Paso 1 del pago: valida el pedido, recalcula el total con el catálogo y,
   si se paga con Yape, crea la orden en Culqi (su checkout la necesita) */
export async function POST(request: Request) {
  try {
    const input = parseCheckoutInput(await request.json());
    const priced = priceOrder(input);
    const orderNumber = newOrderNumber();

    if (input.payment === "wallet" && priced.total > YAPE_MAX) {
      return Response.json({ error: "yape_limit" }, { status: 422 });
    }

    let orderId: string | undefined;
    if (input.payment === "wallet") {
      const res = await createOrder({
        amountCents: priced.amountCents,
        orderNumber,
        description: `Pedido ${orderNumber}`,
        firstName: input.customer.firstName,
        lastName: input.customer.lastName,
        email: input.customer.email,
        phone: input.customer.phone,
      });
      if (res.status !== 201 || !res.data.id) {
        console.error("[culqi] orden rechazada", res.status, res.data);
        return Response.json({ error: "gateway" }, { status: 502 });
      }
      orderId = res.data.id;
    }

    return Response.json({
      orderNumber,
      orderId,
      amountCents: priced.amountCents,
      total: priced.total,
    });
  } catch (e) {
    if (e instanceof OrderError) {
      return Response.json({ error: e.message }, { status: 400 });
    }
    console.error("[checkout/order]", e);
    return Response.json({ error: "server" }, { status: 500 });
  }
}
