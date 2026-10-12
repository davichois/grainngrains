import {
  OrderError,
  parseCheckoutInput,
  priceOrder,
} from "@/src/lib/checkout/order";
import { createCharge } from "@/src/lib/checkout/culqi";
import { sendOrderEmails } from "@/src/lib/checkout/email";

/* Paso 2: cobra con el token que devolvió el checkout de Culqi. El monto se
   vuelve a calcular aquí; nunca se usa uno enviado por el navegador. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseCheckoutInput(body.checkout);
    const priced = priceOrder(input);
    const tokenId = typeof body.tokenId === "string" ? body.tokenId : "";
    const orderNumber =
      typeof body.orderNumber === "string" ? body.orderNumber.slice(0, 40) : "";
    if (!tokenId || !orderNumber) {
      return Response.json({ error: "invalid_body" }, { status: 400 });
    }

    const res = await createCharge({
      amountCents: priced.amountCents,
      email: input.customer.email,
      tokenId,
      description: `Pedido ${orderNumber}`,
      orderNumber,
      firstName: input.customer.firstName,
      lastName: input.customer.lastName,
      phone: input.customer.phone,
      address: input.address.address,
      city: input.address.province,
      deviceId: typeof body.deviceId === "string" ? body.deviceId : undefined,
      authentication3DS:
        body.authentication3DS && typeof body.authentication3DS === "object"
          ? (body.authentication3DS as Record<string, unknown>)
          : undefined,
    });

    /* El banco pide autenticación 3DS */
    if (res.status === 200 && res.data.action_code === "REVIEW") {
      return Response.json({ status: "review" });
    }

    if (res.status === 201) {
      /* Si el correo falla, el pago igual quedó hecho: no se informa error */
      await sendOrderEmails({
        input,
        priced,
        orderNumber,
        chargeId: res.data.id ?? "",
      }).catch((e) => console.error("[email]", e));
      return Response.json({ status: "paid", orderNumber });
    }

    console.warn("[culqi] cargo rechazado", res.status, res.data);
    return Response.json(
      { status: "failed", message: res.data.user_message ?? null },
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
