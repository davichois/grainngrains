import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import ExportMenu from "@/src/components/admin/ExportMenu";
import { listOrders, type OrderFilters } from "@/src/lib/admin/queries";
import { dbReady } from "@/src/lib/db/supabase";
import {
  Badge,
  Card,
  DbNotice,
  Empty,
  PageHeader,
  btnGhost,
  dateTime,
  fieldCls,
  money,
} from "@/src/components/admin/ui";
import FilterForm from "@/src/components/admin/FilterForm";
import Select from "@/src/components/admin/Select";

export const metadata: Metadata = { title: "Pedidos" };

const TABS = [
  { id: "all", label: "Todos" },
  { id: "paid", label: "Por preparar" },
  { id: "preparing", label: "Preparando" },
  { id: "shipped", label: "Enviados" },
  { id: "delivered", label: "Entregados" },
  { id: "pending", label: "Pago pendiente" },
  { id: "cancelled", label: "Cancelados" },
  { id: "refunded", label: "Reembolsados" },
  { id: "rejected", label: "Rechazados" },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const filters: OrderFilters = {
    status: sp.status ?? "all",
    q: sp.q,
    from: sp.from,
    to: sp.to,
    payment: sp.payment,
    page: Number(sp.page) || 1,
  };
  const { rows, more } = await listOrders(filters);
  const qs = (extra: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...extra }))
      if (v !== undefined && v !== "" && v !== "all") p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <>
      {!dbReady() && <DbNotice />}
      <PageHeader
        kicker="Ventas"
        title="Pedidos"
        description="Todo lo que se compra en la web llega aquí solo. Entra a un pedido para prepararlo o marcarlo como enviado (con aviso al cliente)."
        actions={
          <ExportMenu href={`/admin/pedidos/exportar${qs({ page: undefined })}`} />
        }
      />

      {/* Estados */}
      <nav className="-mx-5 mb-6 overflow-x-auto border-b border-adm-line px-5 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-7">
          {TABS.map((t) => {
            const on = (filters.status ?? "all") === t.id;
            return (
              <Link
                key={t.id}
                href={`/admin/pedidos${qs({ status: t.id, page: undefined })}`}
                className={`-mb-px whitespace-nowrap border-b-2 py-3.5 text-[0.625rem] font-semibold uppercase tracking-[0.2em] transition-colors ${
                  on ? "border-[#0FC0FC] text-adm-ink" : "border-transparent text-adm-soft hover:text-adm-ink"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Búsqueda y filtros */}
      <Card className="mb-4">
        <FilterForm className="grid grid-cols-2 gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <input type="hidden" name="status" value={filters.status} />
          <label className="relative col-span-2 lg:col-span-1">
            <span className="sr-only">Buscar</span>
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-adm-faint" />
            <input name="q" defaultValue={sp.q} placeholder="N° de pedido, nombre, correo o celular" className={`${fieldCls} pl-10`} />
          </label>
          <label>
            <span className="sr-only">Desde</span>
            <input type="date" name="from" defaultValue={sp.from} className={fieldCls} aria-label="Desde" />
          </label>
          <label>
            <span className="sr-only">Hasta</span>
            <input type="date" name="to" defaultValue={sp.to} className={fieldCls} aria-label="Hasta" />
          </label>
          <div className="col-span-2 lg:col-span-1">
          <Select name="payment" defaultValue={sp.payment ?? ""} className={fieldCls} aria-label="Método de pago">
              <option value="">Todo pago</option>
              <option value="card">Tarjeta</option>
              <option value="wallet">Yape</option>
            </Select>
          </div>
        </FilterForm>
      </Card>

      {rows.length === 0 ? (
        <Empty
          title="Sin pedidos"
          text={sp.q || sp.from || sp.to || sp.payment ? "Ningún pedido coincide con estos filtros." : "Cuando alguien compre en la web, el pedido aparecerá aquí."}
        />
      ) : (
        <Card padded={false}>
          {/* Computadora: tabla */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead>
              <tr className="border-b border-adm-line text-[0.6875rem] uppercase tracking-[0.15em] text-adm-muted">
                <th className="px-6 py-3 font-bold">Pedido</th>
                <th className="px-3 py-3 font-bold">Cliente</th>
                <th className="px-3 py-3 font-bold">Destino</th>
                <th className="px-3 py-3 font-bold">Estado</th>
                <th className="px-3 py-3 font-bold">Pago</th>
                <th className="px-6 py-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-adm-line">
              {rows.map((o) => (
                <tr key={o.number} className="group cursor-pointer transition-colors hover:bg-adm-subtle">
                  <td className="px-6 py-3.5">
                    <Link href={`/admin/pedidos/${o.number}`} className="block">
                      <span className="tabular-nums tracking-wide text-xs font-bold">{o.number}</span>
                      <span className="block text-xs text-adm-muted">{dateTime(o.created_at)}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-3.5">
                    <Link href={`/admin/pedidos/${o.number}`} className="block">
                      <span className="font-semibold">{o.customer.firstName} {o.customer.lastName}</span>
                      <span className="block truncate text-xs text-adm-muted">{o.customer.email}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-adm-sub">{o.address?.department}</td>
                  <td className="px-3 py-3.5"><Badge status={o.status} /></td>
                  <td className="px-3 py-3.5 text-xs font-semibold">{o.payment_method === "wallet" ? "Yape" : "Tarjeta"}</td>
                  <td className="px-6 py-3.5 text-right font-bold tabular-nums">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Celular: tarjetas */}
          <ul className="divide-y divide-adm-line md:hidden">
            {rows.map((o) => (
              <li key={o.number}>
                <Link href={`/admin/pedidos/${o.number}`} className="block px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="tabular-nums tracking-wide text-xs font-bold">{o.number}</span>
                    <span className="font-bold tabular-nums">{money(o.total)}</span>
                  </div>
                  <p className="mt-1 truncate font-semibold">{o.customer.firstName} {o.customer.lastName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge status={o.status} />
                    <span className="text-xs text-adm-muted">{dateTime(o.created_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(filters.page! > 1 || more) && (
        <div className="mt-4 flex items-center justify-between">
          {filters.page! > 1 ? (
            <Link href={`/admin/pedidos${qs({ page: filters.page! - 1 })}`} className={btnGhost}>
              <ChevronLeft size={16} /> Anteriores
            </Link>
          ) : <span />}
          <span className="text-sm font-semibold text-adm-muted">Página {filters.page}</span>
          {more ? (
            <Link href={`/admin/pedidos${qs({ page: filters.page! + 1 })}`} className={btnGhost}>
              Siguientes <ChevronRight size={16} />
            </Link>
          ) : <span />}
        </div>
      )}
    </>
  );
}
