import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { getOrder } from "@/src/lib/admin/queries";
import {
  Badge,
  Card,
  dateTime,
  fieldCls,
  money,
} from "@/src/components/admin/ui";
import ActionForm from "@/src/components/admin/ActionForm";
import OrderStatusForm from "@/src/components/admin/OrderStatusForm";
import { saveOrderNotes } from "../../actions/orders";

export const metadata: Metadata = { title: "Pedido" };

const GRINDS: Record<string, string> = {
  wholeBean: "Grano entero",
  coarse: "Molido grueso",
  medium: "Molido medio",
  fine: "Molido fino",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  await requireAdmin();
  const { number } = await params;
  const o = await getOrder(decodeURIComponent(number));
  if (!o) notFound();
  const phone = o.customer.phone?.replace(/\D/g, "");

  return (
    <>
      <Link href="/admin/pedidos" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Pedidos
      </Link>

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.25em] text-adm-muted">{dateTime(o.created_at)}</p>
          <h1 className="mt-1 break-all tabular-nums tracking-wide text-2xl font-bold sm:text-3xl">{o.number}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge status={o.status} />
            <span className="bg-adm-surface px-2.5 py-1 text-[0.6875rem] font-bold">
              {o.payment_method === "wallet" ? "Yape" : "Tarjeta"}
            </span>
            {Number(o.refunded_amount) > 0 && (
              <span className="border border-adm-line2 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-adm-sub">
                Reembolsado {money(o.refunded_amount)}
              </span>
            )}
          </div>
        </div>
        <p className="text-3xl font-bold tabular-nums sm:text-4xl">{money(o.total)}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Card title="Productos" padded={false}>
            <ul className="divide-y divide-adm-line">
              {[...o.items, ...o.gifts.map((g) => ({ ...g, gift: true }))].map((i, k) => (
                <li key={k} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-adm-line2 text-base font-semibold">
                    {i.qty}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {i.name}
                      {"gift" in i && (
                        <span className="ml-2 border border-adm-line2 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-adm-sub">Regalo</span>
                      )}
                    </p>
                    <p className="text-xs text-adm-muted">
                      {i.size} · {GRINDS[i.grind] ?? i.grind}{i.options && ` · ${i.options}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{"gift" in i ? "S/ 0.00" : money(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-adm-line px-5 py-4 text-sm sm:px-6">
              <div className="flex justify-between"><dt className="text-adm-muted">Subtotal</dt><dd className="tabular-nums">{money(o.subtotal)}</dd></div>
              {o.coupons.filter((c) => c.discount > 0).map((c) => (
                <div key={c.code} className="flex justify-between text-adm-ink">
                  <dt>Cupón <span className="bg-adm-solid px-1.5 py-0.5 tabular-nums tracking-wide text-[0.6875rem] font-bold text-[#D4FF47]">{c.code}</span></dt>
                  <dd className="tabular-nums">−{money(c.discount)}</dd>
                </div>
              ))}
              <div className="flex justify-between"><dt className="text-adm-muted">Envío</dt><dd className="tabular-nums">{Number(o.shipping) === 0 ? "Gratis" : money(o.shipping)}</dd></div>
              <div className="flex justify-between border-t border-dashed border-adm-line2 pt-2 text-lg font-bold"><dt>Total</dt><dd className="tabular-nums">{money(o.total)}</dd></div>
            </dl>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Cliente">
              <p className="font-semibold">{o.customer.firstName} {o.customer.lastName}</p>
              <p className="mt-1 break-all text-sm text-adm-sub">{o.customer.email}</p>
              <p className="text-sm text-adm-sub">{o.customer.phone}</p>
              {o.customer.newsletter && (
                <p className="mt-2 inline-block border border-adm-line2 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-adm-sub">Acepta novedades</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`mailto:${o.customer.email}?subject=${encodeURIComponent(`Tu pedido ${o.number} · Grain & Grains`)}`} className="inline-flex items-center gap-2 border border-adm-line3 bg-adm-surface px-3.5 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-ink transition-colors hover:border-adm-strong"><Mail size={14} /> Correo</a>
                {phone && (
                  <>
                    <a href={`https://wa.me/51${phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-adm-line3 bg-adm-surface px-3.5 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-ink transition-colors hover:border-adm-strong"><MessageCircle size={14} /> WhatsApp</a>
                    <a href={`tel:+51${phone}`} className="inline-flex items-center gap-2 border border-adm-line3 bg-adm-surface px-3.5 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-ink transition-colors hover:border-adm-strong"><Phone size={14} /> Llamar</a>
                  </>
                )}
              </div>
            </Card>
            <Card title="Envío y comprobante">
              <p className="text-sm font-semibold">{o.address.address}</p>
              <p className="text-sm text-adm-sub">{[o.address.district, o.address.province, o.address.department].filter(Boolean).join(", ")}</p>
              {o.address.reference && <p className="mt-1 text-xs text-adm-muted">Ref.: {o.address.reference}</p>}
              <div className="mt-4 border-l-2 border-adm-line3 bg-adm-subtle px-4 py-3 text-sm">
                {o.receipt.type === "factura" ? (
                  <>
                    <p className="font-bold">Factura</p>
                    <p>RUC {o.receipt.ruc}</p>
                    <p className="text-adm-sub">{o.receipt.businessName}</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold">Boleta</p>
                    <p>Doc. {o.receipt.document}</p>
                  </>
                )}
              </div>
              {(o.carrier || o.tracking_code) && (
                <p className="mt-3 text-sm"><strong>{o.carrier}</strong> {o.tracking_code && <span className="tabular-nums tracking-wide">· {o.tracking_code}</span>}</p>
              )}
            </Card>
          </div>

          <Card title="Historial">
            <ol className="relative space-y-4 border-l-2 border-adm-line pl-5">
              {[...o.history].reverse().map((h, k) => (
                <li key={k} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border border-adm-surface bg-[#0FC0FC]" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge status={h.status} />
                    <span className="text-xs text-adm-muted">{dateTime(h.at)} · {h.by}</span>
                  </div>
                  {h.note && <p className="mt-1 text-sm">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Preparar y enviar">
            <OrderStatusForm number={o.number} status={o.status} carrier={o.carrier} tracking={o.tracking_code} />
          </Card>

          <Card title="Notas internas">
            <ActionForm action={saveOrderNotes} submit="Guardar notas">
              <input type="hidden" name="number" value={o.number} />
              <textarea name="notes" rows={4} defaultValue={o.notes ?? ""} placeholder="Solo las ve el equipo" className={`${fieldCls} resize-y`} />
            </ActionForm>
          </Card>

          <Card title="Pago">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-adm-muted">Método</dt><dd className="font-semibold">{o.payment_method === "wallet" ? "Yape" : "Tarjeta"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-adm-muted">Estado en MP</dt><dd className="font-semibold">{o.payment_status ?? "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-adm-muted">ID de pago</dt><dd className="tabular-nums tracking-wide text-xs">{o.payment_id ?? "—"}</dd></div>
            </dl>

          </Card>
        </div>
      </div>
    </>
  );
}
