import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { translationConfig } from "@/src/lib/admin/texts";
import { combosView, productsView, sizesView, listTextOverrides } from "@/src/lib/admin/queries";
import { comboCoffees, localeOptions } from "@/src/lib/admin/combo-coffees";
import { textsFor } from "@/src/lib/admin/texts";
import { dbReady } from "@/src/lib/db/supabase";
import { Badge, DbNotice, btnDanger, money } from "@/src/components/admin/ui";
import ActionForm from "@/src/components/admin/ActionForm";
import ComboForm from "@/src/components/admin/ComboForm";
import { deleteCombo } from "../../actions/combos";

export const metadata: Metadata = { title: "Editar combo" };

export default async function ComboPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [combos, editions, sizes] = await Promise.all([combosView(), productsView(), sizesView(), listTextOverrides()]);
  const c = combos.find((x) => x.id === id);
  if (!c) notFound();
  const names = await textsFor(`cart.combos.${id}.name`);
  const ready = dbReady();

  return (
    <>
      {!ready && <DbNotice />}
      <Link href="/admin/combos" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Combos
      </Link>
      <header className="mb-8 flex flex-col gap-5 border-b border-adm-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-adm-faint">
            Combo · {c.custom ? "Creado en el panel" : "Del código"}
          </p>
          <h1 className="mt-2 break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{c.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold tabular-nums">{money(c.price)}</span>
            <span className="tabular-nums text-adm-muted line-through">{money(c.regular)}</span>
            <Badge status={c.active ? "active" : "paused"} />
          </div>
          {c.hidden && <p className="mt-2 text-xs font-medium text-adm-red">No se muestra en la web: tiene un café oculto.</p>}
        </div>
        <ActionForm
          action={deleteCombo.bind(null, c.id)}
          submit={<><Trash2 size={14} /> Eliminar</>}
          submitClass={btnDanger}
          className=""
          confirm={`¿Eliminar el combo "${c.name}"? ${c.custom ? "Se borra para siempre." : "Es del código: queda oculto y lo puedes restaurar."}`}
        >
          {null}
        </ActionForm>
      </header>
      <ComboForm combo={c} coffees={comboCoffees(editions)} sizes={sizes.map((s) => ({ id: s.id, label: s.label }))} names={names} locales={localeOptions()} translation={await translationConfig()} />
    </>
  );
}
