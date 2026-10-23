import { currentSession } from "@/src/lib/admin/auth";
import { exportOrders } from "@/src/lib/admin/queries";
import { exportResponse, readFormat, type ExportColumn } from "@/src/lib/admin/export";
import { statusLabel } from "@/src/components/admin/ui";

/* Pedidos en CSV, Excel o PDF (?formato=csv|xlsx|pdf), con los mismos filtros de la lista */
export async function GET(request: Request) {
  if (!(await currentSession())) return new Response(null, { status: 401 });
  const sp = new URL(request.url).searchParams;
  const orders = await exportOrders({
    status: sp.get("status") ?? "all",
    q: sp.get("q") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    payment: sp.get("payment") ?? undefined,
  });
  const columns: ExportColumn[] = [
    { title: "Pedido" }, { title: "Fecha", width: 20 }, { title: "Estado" }, { title: "Pago" },
    { title: "Cliente", width: 24 }, { title: "Correo", width: 28, pdf: false }, { title: "Celular" },
    { title: "Comprobante", pdf: false }, { title: "Documento/RUC", pdf: false }, { title: "Razón social", pdf: false },
    { title: "Departamento", pdf: false }, { title: "Provincia", pdf: false }, { title: "Distrito" },
    { title: "Dirección", width: 32, pdf: false }, { title: "Productos", width: 40 }, { title: "Cupones" },
    { title: "Subtotal", money: true }, { title: "Descuento", money: true }, { title: "Envío", money: true },
    { title: "Total", money: true }, { title: "Reembolsado", money: true, pdf: false },
    { title: "Empresa de envío", pdf: false }, { title: "Seguimiento" }, { title: "ID de pago", pdf: false },
  ];
  const rows = orders.map((o) => [
    o.number,
    new Date(o.created_at).toLocaleString("es-PE", { timeZone: "America/Lima" }),
    statusLabel(o.status),
    o.payment_method === "wallet" ? "Yape" : "Tarjeta",
    `${o.customer.firstName} ${o.customer.lastName}`,
    o.customer.email,
    o.customer.phone,
    o.receipt?.type === "factura" ? "Factura" : "Boleta",
    o.receipt?.type === "factura" ? o.receipt.ruc : o.receipt?.document,
    o.receipt?.type === "factura" ? o.receipt.businessName : "",
    o.address?.department,
    o.address?.province,
    o.address?.district,
    o.address?.address,
    o.items.map((i) => `${i.qty}× ${i.name} (${i.size}${i.options ? ` · ${i.options}` : ""})`).join(" | "),
    o.coupons.map((c) => c.code).join(" "),
    Number(o.subtotal).toFixed(2),
    Number(o.discount).toFixed(2),
    Number(o.shipping).toFixed(2),
    Number(o.total).toFixed(2),
    Number(o.refunded_amount).toFixed(2),
    o.carrier,
    o.tracking_code,
    o.payment_id,
  ]);
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  return exportResponse(readFormat(sp.get("formato")), { name: `pedidos-${day}`, title: "Pedidos", columns, rows });
}
