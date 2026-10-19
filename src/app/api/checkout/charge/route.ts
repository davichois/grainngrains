import {
  OrderError,
  newOrderNumber,
  parseCheckoutInput,
  priceOrder,
  YAPE_MAX,
} from "@/src/lib/checkout/order";
import { createPayment, rejectionReason } from "@/src/lib/checkout/mercadopago";
import { completeOrder, customerDocument } from "@/src/lib/checkout/fulfill";
import { loadCouponUsage } from "@/src/lib/coupons/usage";

/* Cobro con Mercado Pago: valida el pedido, recalcula el total con el
   catálogo (nunca se usa un monto enviado por el navegador) y crea el pago
   con el token de tarjeta o de Yape generado en el checkout. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseCheckoutInput(body.checkout);
    /* Límites de uso de cupones (veces, por cliente, primera compra) */
    const usage = await loadCouponUsage({
      email: input.customer.email,
      document: customerDocument(input),
    });
    const priced = priceOrder(input, { usage });
    const wallet = input.payment === "wallet";

    const token = typeof body.token === "string" ? body.token.slice(0, 200) : "";
    const paymentMethodId = wallet
      ? "yape"
      : typeof body.paymentMethodId === "string" &&
          /^[a-z_]{2,30}$/.test(body.paymentMethodId)
        ? body.paymentMethodId
        : "";
    const issuerId = Number(body.issuerId) || undefined;
    const deviceId =
      typeof body.deviceId === "string" && /^[\w-]{1,100}$/.test(body.deviceId)
        ? body.deviceId
        : undefined;
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
      deviceId,
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
      /* Correos + usos de cupones; si fallan, el pago igual quedó hecho */
      await completeOrder({
        input,
        priced,
        orderNumber,
        paymentId: String(data.id),
      });
      return Response.json({ status: "paid", orderNumber });
    }

    /* 3D Secure: el cliente confirma con su banco en el checkout */
    const ds = data.three_ds_info;
    if (
      data.status_detail === "pending_challenge" &&
      ds?.external_resource_url &&
      ds.creq
    ) {
      return Response.json({
        status: "challenge",
        paymentId: String(data.id),
        orderNumber,
        url: ds.external_resource_url,
        creq: ds.creq,
      });
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
