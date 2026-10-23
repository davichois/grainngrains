import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { coffeeOptionsView } from "@/src/lib/admin/queries";
import { dbReady } from "@/src/lib/db/supabase";
import { Badge, Card, DbNotice, Empty, PageHeader, btnPrimary } from "@/src/components/admin/ui";
import ActionSwitch from "@/src/components/admin/ActionSwitch";
import { toggleCoffeeOption } from "../actions/options";

export const metadata: Metadata = { title: "Varietales y procesos" };

const linkCls =
  "inline-flex items-center gap-1.5 border border-adm-line3 bg-adm-surface px-3 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-ink transition-colors hover:border-adm-strong";

export default async function OptionsPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  await requireAdmin();
  const kind = (await searchParams).tipo === "procesos" ? "processes" : "varietals";
  const [varietals, processes] = await Promise.all([coffeeOptionsView("varietals"), coffeeOptionsView("processes")]);
  const list = kind === "varietals" ? varietals : processes;
  const one = kind === "varietals" ? "varietal" : "proceso";
  const ready = dbReady();
  const tabs = [
    { id: "varietals", label: `Varietales (${varietals.length})`, href: "/admin/opciones" },
    { id: "processes", label: `Procesos (${processes.length})`, href: "/admin/opciones?tipo=procesos" },
  ];

  return (
    <>
      {!ready && <DbNotice />}
      <PageHeader
        kicker="Catálogo"
        title="Varietales y procesos"
        description="Crea todas las que quieras. En cada café (Productos → Editar) marcas cuáles tiene y cuáles ve el cliente al comprar."
        actions={
          <Link href={`/admin/opciones/nuevo?tipo=${kind === "varietals" ? "varietales" : "procesos"}`} className={btnPrimary}>
            <Plus size={16} /> {kind === "varietals" ? "Nueva varietal" : "Nuevo proceso"}
          </Link>
        }
      />
      <nav className="-mx-5 mb-6 overflow-x-auto border-b border-adm-line px-5 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-7">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className={`-mb-px whitespace-nowrap border-b-2 py-3.5 text-[0.625rem] font-semibold uppercase tracking-[0.2em] transition-colors ${
                kind === t.id ? "border-[#0FC0FC] text-adm-ink" : "border-transparent text-adm-soft hover:text-adm-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      {list.length === 0 ? (
        <Empty title={`Sin ${kind === "varietals" ? "varietales" : "procesos"}`} text={`Crea ${kind === "varietals" ? "la primera" : "el primero"} con «${kind === "varietals" ? "Nueva varietal" : "Nuevo proceso"}».`} />
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-adm-line">
            {list.map((o) => (
              <li key={o.id} className={`flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:flex-nowrap sm:px-7 ${o.active ? "" : "opacity-70"}`}>
                <Link href={`/admin/opciones/${kind}/${o.id}`} className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{o.label}</span>
                    <Badge status={o.active ? "active" : "paused"} label={o.active ? "Activa" : "Inactiva"} />
                  </span>
                  <span className="mt-1 block truncate text-xs text-adm-muted">
                    {o.coffees.length
                      ? `${o.coffees.length} café${o.coffees.length === 1 ? "" : "s"}: ${o.coffees.map((c) => c.name).join(" · ")}`
                      : "Ningún café la tiene todavía"}
                  </span>
                </Link>
                <div className="ml-auto flex items-center gap-3">
                  <ActionSwitch
                    action={toggleCoffeeOption.bind(null, kind, o.id)}
                    active={o.active}
                    disabled={!ready}
                    label={o.active ? `Desactivar ${one}` : `Activar ${one}`}
                  />
                  <Link href={`/admin/opciones/${kind}/${o.id}`} className={linkCls}><Pencil size={12} /> Editar</Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
