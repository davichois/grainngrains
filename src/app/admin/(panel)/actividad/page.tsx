import type { Metadata } from "next";
import { requireAdmin } from "@/src/lib/admin/auth";
import { listAudit } from "@/src/lib/admin/queries";
import { dbReady } from "@/src/lib/db/supabase";
import { Card, DbNotice, Empty, PageHeader, dateTime } from "@/src/components/admin/ui";

export const metadata: Metadata = { title: "Actividad" };

const detail = (d: Record<string, unknown> | null) =>
  d
    ? Object.entries(d)
        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
        .join(" · ")
    : "";

export default async function ActivityPage() {
  await requireAdmin();
  const rows = await listAudit();
  return (
    <>
      {!dbReady() && <DbNotice />}
      <PageHeader kicker="Historial" title="Actividad" description="Todo lo que se cambió desde el panel: precios, stock, cupones, pedidos y ajustes (últimos 300)." />
      {rows.length === 0 ? (
        <Empty title="Sin actividad" text="Cuando guardes algo en el panel, quedará registrado aquí." />
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-adm-line">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3 sm:px-6">
                <span className="w-36 shrink-0 text-xs text-adm-muted">{dateTime(r.at)}</span>
                <span className="text-sm font-semibold">{r.action}</span>
                {r.entity_id && <span className="border border-adm-line2 px-2 py-0.5 tabular-nums tracking-wide text-[0.6875rem] font-semibold text-adm-sub">{r.entity_id}</span>}
                {r.detail && <span className="w-full truncate text-xs text-adm-muted sm:w-auto sm:flex-1">{detail(r.detail)}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
