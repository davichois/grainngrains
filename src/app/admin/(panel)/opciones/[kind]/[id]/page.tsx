import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { coffeeOptionsView, listTextOverrides } from "@/src/lib/admin/queries";
import { textsFor } from "@/src/lib/admin/texts";
import { dbReady } from "@/src/lib/db/supabase";
import { Badge, Card, DbNotice, btnDanger } from "@/src/components/admin/ui";
import ActionForm from "@/src/components/admin/ActionForm";
import ActionSwitch from "@/src/components/admin/ActionSwitch";
import OptionForm from "@/src/components/admin/OptionForm";
import { deleteCoffeeOption, toggleProductOption } from "../../../actions/options";

export const metadata: Metadata = { title: "Varietal o proceso" };

export default async function OptionPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  await requireAdmin();
  const { kind: rawKind, id } = await params;
  if (rawKind !== "varietals" && rawKind !== "processes") notFound();
  const kind = rawKind;
  const [options] = await Promise.all([coffeeOptionsView(kind), listTextOverrides()]);
  const o = options.find((x) => x.id === id);
  if (!o) notFound();
  const names = await textsFor(`shop.${kind}.${id}`);
  const ready = dbReady();
  const what = kind === "varietals" ? "Varietal" : "Proceso";

  return (
    <>
      {!ready && <DbNotice />}
      <Link href={`/admin/opciones${kind === "processes" ? "?tipo=procesos" : ""}`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Varietales y procesos
      </Link>
      <header className="mb-8 flex flex-col gap-5 border-b border-adm-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-adm-faint">{what}</p>
          <h1 className="mt-2 break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{o.label}</h1>
          <div className="mt-2"><Badge status={o.active ? "active" : "paused"} label={o.active ? "Activa" : "Inactiva"} /></div>
        </div>
        <ActionForm
          action={deleteCoffeeOption.bind(null, kind, id)}
          submit={<><Trash2 size={14} /> Eliminar</>}
          submitClass={btnDanger}
          className=""
          confirm={`¿Eliminar "${o.label}"? Se quita de ${o.coffees.length} café${o.coffees.length === 1 ? "" : "s"} y no se puede deshacer.`}
        >
          {null}
        </ActionForm>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <OptionForm kind={kind} id={id} names={names} sort={o.sort} active={o.active} />

        <Card title={`Cafés con ${kind === "varietals" ? "esta varietal" : "este proceso"} · ${o.coffees.length}`} padded={false} className="h-fit">
          {o.coffees.length === 0 ? (
            <p className="px-5 py-5 text-[0.8125rem] text-adm-muted sm:px-7">
              Ningún café la tiene. Márcala en <Link href="/admin/productos" className="font-semibold text-adm-cyan-ink underline underline-offset-2">Productos → Editar</Link>.
            </p>
          ) : (
            <ul className="divide-y divide-adm-line">
              {o.coffees.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3 sm:px-7">
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden" style={{ backgroundColor: c.cardBg }}>
                    {c.image && <Image src={c.image} alt="" fill sizes="40px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{c.name}</span>
                    <span className="text-xs text-adm-muted">{c.visible ? "Visible al cliente" : "Oculta al cliente"}</span>
                  </span>
                  <ActionSwitch
                    action={toggleProductOption.bind(null, kind, c.id, id)}
                    active={c.visible}
                    disabled={!ready}
                    label={c.visible ? "Ocultar al cliente" : "Mostrar al cliente"}
                  />
                  <Link href={`/admin/productos/${c.id}`} aria-label={`Editar ${c.name}`} className="p-1 text-adm-muted hover:text-adm-ink"><Pencil size={14} /></Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
