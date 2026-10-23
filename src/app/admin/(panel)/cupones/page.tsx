import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { couponsView } from "@/src/lib/admin/queries";
import { rewardText } from "@/src/lib/admin/coupon-format";
import { dbReady } from "@/src/lib/db/supabase";
import { Badge, Card, DbNotice, Empty, PageHeader, btnPrimary, fieldCls, money } from "@/src/components/admin/ui";
import CouponToggle from "@/src/components/admin/CouponToggle";
import DeleteCouponButton from "@/src/components/admin/DeleteCouponButton";
import FilterForm from "@/src/components/admin/FilterForm";
import Select from "@/src/components/admin/Select";

export const metadata: Metadata = { title: "Cupones" };

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string }>;
}) {
  await requireAdmin();
  const { q, show } = await searchParams;
  const ready = dbReady();
  const term = q?.trim().toUpperCase();
  const all = await couponsView();
  const list = all.filter(
    (c) =>
      (show === "hidden" ? c.hidden : !c.hidden) &&
      (!term || c.code.includes(term) || c.coupon.aliases?.some((a) => a.includes(term)) || c.coupon.note?.toUpperCase().includes(term)),
  );
  const active = all.filter((c) => !c.hidden && c.coupon.active !== false).length;

  return (
    <>
      {!ready && <DbNotice />}
      <PageHeader
        kicker="Promociones"
        title="Cupones"
        description={`${active} activos. Los usos y el descuento cuentan solo pedidos pagados. Los cupones que estaban en el código también se pueden editar o pausar desde aquí.`}
        actions={
          <Link href="/admin/cupones/nuevo" className={btnPrimary}>
            <Plus size={16} /> Nuevo cupón
          </Link>
        }
      />
      <Card className="mb-4">
        <FilterForm className="flex flex-wrap gap-3">
          <label className="relative min-w-48 flex-1">
            <span className="sr-only">Buscar</span>
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-adm-faint" />
            <input name="q" defaultValue={q} placeholder="Código, alias o nota" className={`${fieldCls} pl-10 uppercase`} />
          </label>
          <Select name="show" defaultValue={show ?? ""} className={`${fieldCls} min-w-44`} aria-label="Mostrar">
            <option value="">Vigentes</option>
            <option value="hidden">Eliminados</option>
          </Select>
        </FilterForm>
      </Card>

      {list.length === 0 ? (
        <Empty title="Sin cupones" text={term ? "Ningún cupón coincide." : "Crea el primero con «Nuevo cupón»."} />
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-adm-line">
            {list.map((c) => {
              const on = c.coupon.active !== false;
              return (
                <li key={c.code} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:flex-nowrap sm:px-6">
                  <Link href={`/admin/cupones/${c.code}`} className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-adm-solid px-2.5 py-1 tabular-nums tracking-wide text-xs font-bold text-[#D4FF47]">{c.code}</span>
                      <Badge status={c.hidden ? "hidden" : on ? "active" : "paused"} />
                      {c.coupon.autoApply && <span className="border border-adm-line2 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-adm-sub">Automático</span>}
                      <span className="text-[0.6875rem] font-bold uppercase tracking-wide text-adm-faint">
                        {c.origin === "panel" ? "Creado en el panel" : c.origin === "both" ? "Del código · editado" : "Del código"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold">{rewardText(c.coupon)}</p>
                    {c.coupon.note && <p className="mt-0.5 line-clamp-1 text-xs text-adm-muted">{c.coupon.note}</p>}
                  </Link>
                  {/* En celular: usos a la izquierda y acciones a la derecha, en su propia fila */}
                  <div className="flex w-full items-center gap-3 border-t border-adm-line pt-3 sm:w-auto sm:border-0 sm:pt-0">
                    <div className="text-xs sm:text-right">
                      <p className="font-bold tabular-nums">{c.uses} usos</p>
                      <p className="tabular-nums text-adm-muted">−{money(c.discount)}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      {!c.hidden && <CouponToggle coupon={c.coupon} disabled={!ready} />}
                      {!c.hidden && <DeleteCouponButton code={c.code} fromCode={c.origin !== "panel"} disabled={!ready} compact />}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
