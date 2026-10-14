import {
  OrderError,
  newOrderNumber,
  parseCheckoutInput,
  priceOrder,
  YAPE_MAX,
} from "@/src/lib/checkout/order";
import { createPayment, rejectionReason } from "@/src/lib/checkout/mercadopago";
import { sendOrderEmails } from "@/src/lib/checkout/email";

/* Cobro con Mercado Pago: valida el pedido, recalcula el total con el
   catálogo (nunca se usa un monto enviado por el navegador) y crea el pago
   con el token de tarjeta o de Yape generado en el checkout. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseCheckoutInput(body.checkout);
    const priced = priceOrder(input);
    const wallet = input.payment === "wallet";

    const token = typeof body.token === "string" ? body.token.slice(0, 200) : "";
    const paymentMethodId = wallet
      ? "yape"
      : typeof body.paymentMethodId === "string" &&
          /^[a-z_]{2,30}$/.test(body.paymentMethodId)
        ? body.paymentMethodId
        : "";
    const issuerId = Number(body.issuerId) || undefined;
    if (!token || !paymentMethodId) {
      return Response.json({ error: "invalid_body" }, { status: 400 });
    }
    if (wallet && priced.total > YAPE_MAX) {
      return Response.json({ error: "yape_limit" }, { status: 422 });
    }

    const orderNumber = newOrderNumber();
    const { status, data } = await createPayment({
      input,
      priced,
      orderNumber,
      token,
      paymentMethodId,
      issuerId,
    });

    if (status >= 400 || !data.id) {
      console.error("[mercadopago] pago no creado", status, data.message, data.cause);
      /* 401/403: credenciales; otro 4xx: datos de la tarjeta o del código Yape */
      const reason =
        status >= 500 || status === 401 || status === 403
          ? "gateway"
          : wallet
            ? "yape_check"
            : "check_card_data";
      return Response.json({ status: "failed", error: reason }, { status: 402 });
    }

    if (data.status === "approved") {
      /* Si el correo falla, el pago igual quedó hecho: no se informa error */
      await sendOrderEmails({
        input,
        priced,
        orderNumber,
        chargeId: String(data.id),
      }).catch((e) => console.error("[email]", e));
      return Response.json({ status: "paid", orderNumber });
    }

    /* En revisión: Mercado Pago avisará por webhook cuando se resuelva */
    if (data.status === "in_process" || data.status === "pending") {
      return Response.json({ status: "review", orderNumber });
    }

    console.warn("[mercadopago] pago rechazado", data.id, data.status_detail);
    return Response.json(
      { status: "failed", error: rejectionReason(data.status_detail, wallet) },
      { status: 402 },
    );
  } catch (e) {
    if (e instanceof OrderError) {
      return Response.json({ error: e.message }, { status: 400 });
    }
    console.error("[checkout/charge]", e);
    return Response.json({ error: "server" }, { status: 500 });
  }
}
