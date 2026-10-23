import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Inbox,
  PackageOpen,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { dashboard } from "@/src/lib/admin/queries";
import {
  Badge,
  Card,
  DbNotice,
  Empty,
  Stat,
  dateTime,
  money,
} from "@/src/components/admin/ui";
import SalesChart from "@/src/components/admin/SalesChart";

export const metadata: Metadata = { title: "Resumen" };

export default async function DashboardPage() {
  await requireAdmin();
  const d = await dashboard();
  const payTotal = d.payments.card + d.payments.wallet;
  const cardPct = payTotal ? Math.round((d.payments.card / payTotal) * 100) : 0;

  return (
    <>
      {!d.connected && <DbNotice />}

      <div className="mb-6 flex justify-end">
        <Link href="/admin/pedidos?status=paid" className="inline-flex items-center gap-2 border border-[#0FC0FC] bg-[#0FC0FC] px-5 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-[#1E1E1E] transition-colors hover:border-adm-strong hover:bg-adm-solid hover:text-white">
          <PackageOpen size={16} />
          {d.toPrepare} por preparar
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat accent label="Hoy" value={money(d.today)} hint={`${d.todayCount} pedido${d.todayCount === 1 ? "" : "s"}`} icon={<TrendingUp size={18} />} />
        <Stat label="Últimos 7 días" value={money(d.week)} icon={<CalendarDays size={18} />} />
        <Stat label="Últimos 30 días" value={money(d.month)} hint={`${d.monthCount} pedidos`} icon={<Receipt size={18} />} />
        <Stat label="Ticket promedio" value={money(d.avgTicket)} hint="últimos 30 días" icon={<CreditCard size={18} />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Ventas · 30 días" className="lg:col-span-2" aside={<span className="text-sm font-bold tabular-nums">{money(d.month)}</span>}>
          <SalesChart data={d.byDay} />
        </Card>

        <Card title="Pendientes">
          <ul className="space-y-3">
            {[
              { label: "Pagados, por preparar", n: d.toPrepare, href: "/admin/pedidos?status=paid", hot: true },
              { label: "Preparando", n: d.preparing, href: "/admin/pedidos?status=preparing" },
              { label: "Pago pendiente (3DS / revisión)", n: d.pending, href: "/admin/pedidos?status=pending" },
              { label: "Mensajes nuevos", n: d.newMessages, href: "/admin/mensajes?status=new", hot: true },
            ].map((r) => (
              <li key={r.label}>
                <Link href={r.href} className="group flex items-center justify-between gap-3 border-b border-adm-line py-3.5 transition-colors hover:text-adm-ink">
                  <span className="text-[0.8125rem] text-adm-sub group-hover:text-adm-ink">{r.label}</span>
                  <span className={`flex h-7 min-w-7 items-center justify-center px-2 text-sm font-semibold tabular-nums ${r.hot && r.n ? "bg-[#D4FF47] text-[#1E1E1E]" : "text-adm-faint"}`}>
                    {r.n}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-adm-muted">
              Pagos · 30 días
            </p>
            <div className="mt-2 flex h-3 overflow-hidden bg-adm-line">
              <div className="bg-[#0FC0FC]" style={{ width: `${cardPct}%` }} />
              <div className="bg-adm-faint" style={{ width: `${payTotal ? 100 - cardPct : 0}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs font-semibold">
              <span>Tarjeta · {d.payments.card}</span>
              <span className="text-adm-faint">Yape · {d.payments.wallet}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card
          title="Últimos pedidos"
          className="lg:col-span-2"
          padded={false}
          aside={<Link href="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-bold hover:underline">Ver todos <ArrowUpRight size={14} /></Link>}
        >
          {d.recent.length ? (
            <ul className="divide-y divide-adm-line">
              {d.recent.map((o) => (
                <li key={o.number}>
                  <Link href={`/admin/pedidos/${o.number}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors hover:bg-adm-subtle sm:px-6">
                    <span className="tabular-nums tracking-wide text-xs font-bold">{o.number}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {o.customer.firstName} {o.customer.lastName}
                    </span>
                    <Badge status={o.status} />
                    <span className="w-24 text-right text-sm font-bold tabular-nums">{money(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5 sm:p-6">
              <Empty title="Aún no hay pedidos" text="Cuando alguien compre en la web, el pedido aparecerá aquí solo." />
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card title="Más vendidos">
            {d.topProducts.length ? (
              <ol className="space-y-2.5">
                {d.topProducts.map((p, i) => (
                  <li key={p.name} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-adm-line2 text-xs font-semibold text-adm-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                    <span className="text-xs font-bold tabular-nums text-adm-muted">{p.qty} u.</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-adm-muted">Sin ventas en los últimos 90 días.</p>
            )}
          </Card>
          <Card title="Cupones más usados">
            {d.topCoupons.length ? (
              <ul className="space-y-2.5">
                {d.topCoupons.map((c) => (
                  <li key={c.code} className="flex items-center gap-3">
                    <span className="bg-adm-solid px-2 py-1 tabular-nums tracking-wide text-[0.6875rem] font-bold text-[#D4FF47]">{c.code}</span>
                    <span className="flex-1 text-xs text-adm-muted">{c.uses} usos</span>
                    <span className="text-xs font-bold tabular-nums">−{money(c.discount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-adm-muted">Aún no se usaron cupones.</p>
            )}
          </Card>
          <Card title="Mensajes" aside={<Link href="/admin/mensajes" className="text-sm font-bold hover:underline">Bandeja</Link>}>
            {d.messages.length ? (
              <ul className="space-y-2">
                {d.messages.map((m) => (
                  <li key={m.id}>
                    <Link href={`/admin/mensajes/${m.id}`} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-adm-subtle">
                      <Inbox size={15} className={m.status === "new" ? "text-adm-muted" : "text-adm-faint"} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{m.name}</span>
                      <span className="text-[0.6875rem] text-adm-muted">{dateTime(m.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-adm-muted">Sin mensajes todavía.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
