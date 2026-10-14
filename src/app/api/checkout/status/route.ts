import { getPayment, rejectionReason } from "@/src/lib/checkout/mercadopago";
import { fulfillPayment } from "@/src/lib/checkout/fulfill";

/* Estado de un pago tras el 3D Secure. El checkout lo consulta hasta que el
   pago se aprueba o se rechaza; al aprobarse se envían los correos. */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^\d{1,20}$/.test(id)) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    const { status, data } = await getPayment(id);
    if (status !== 200) {
      return Response.json({ error: "gateway" }, { status: 502 });
    }
    const orderNumber = data.external_reference ?? "";
    if (data.status === "approved") {
      await fulfillPayment(data).catch((e) => console.error("[email]", e));
      return Response.json({ status: "paid", orderNumber });
    }
    if (data.status === "rejected" || data.status === "cancelled") {
      return Response.json({
        status: "failed",
        error:
          data.status_detail === "expired"
            ? "challenge_expired"
            : rejectionReason(data.status_detail, false),
      });
    }
    /* Sigue en 3DS o en revisión */
    return Response.json({
      status: data.status_detail === "pending_challenge" ? "pending" : "review",
      orderNumber,
    });
  } catch (e) {
    console.error("[checkout/status]", e);
    return Response.json({ error: "server" }, { status: 500 });
  }
}
