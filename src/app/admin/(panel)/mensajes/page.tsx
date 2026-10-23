import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { listMessages } from "@/src/lib/admin/queries";
import { dbReady } from "@/src/lib/db/supabase";
import {
  Badge,
  Card,
  DbNotice,
  Empty,
  PageHeader,
  dateTime,
  fieldCls,
} from "@/src/components/admin/ui";
import { TYPE_LABEL } from "@/src/lib/admin/labels";
import FilterForm from "@/src/components/admin/FilterForm";
import Select from "@/src/components/admin/Select";

export const metadata: Metadata = { title: "Mensajes" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = await listMessages({ status: sp.status, type: sp.type, q: sp.q });

  return (
    <>
      {!dbReady() && <DbNotice />}
      <PageHeader
        kicker="Bandeja"
        title="Mensajes"
        description="Consultas y cotizaciones del formulario de contacto. También te llegan por correo; aquí llevas el seguimiento."
      />
      <Card className="mb-4">
        <FilterForm className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <label className="relative col-span-2 sm:col-span-1">
            <span className="sr-only">Buscar</span>
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-adm-faint" />
            <input name="q" defaultValue={sp.q} placeholder="Nombre, correo, empresa o texto" className={`${fieldCls} pl-10`} />
          </label>
          <Select name="status" defaultValue={sp.status ?? "all"} className={fieldCls} aria-label="Estado">
            <option value="all">Todos</option>
            <option value="new">Nuevos</option>
            <option value="replied">Respondidos</option>
            <option value="closed">Cerrados</option>
          </Select>
          <Select name="type" defaultValue={sp.type ?? "all"} className={fieldCls} aria-label="Tipo">
            <option value="all">Todo tipo</option>
            {Object.entries(TYPE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FilterForm>
      </Card>

      {rows.length === 0 ? (
        <Empty title="Bandeja vacía" text="Cuando alguien escriba desde la página de contacto, aparecerá aquí." />
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-adm-line">
            {rows.map((m) => (
              <li key={m.id}>
                <Link href={`/admin/mensajes/${m.id}`} className={`flex gap-4 px-5 py-4 transition-colors hover:bg-adm-subtle sm:px-6 ${m.status === "new" ? "bg-adm-subtle" : ""}`}>
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${m.status === "new" ? "bg-[#0FC0FC]" : "bg-transparent"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`truncate ${m.status === "new" ? "font-bold" : "font-semibold"}`}>{m.name}</span>
                      {m.company && <span className="text-xs text-adm-muted">· {m.company}</span>}
                      <span className="ml-auto text-xs text-adm-muted">{dateTime(m.created_at)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-sm text-adm-sub">{m.message}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="border border-adm-line2 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-adm-sub">{TYPE_LABEL[m.type] ?? m.type}</span>
                      <Badge status={m.status} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
