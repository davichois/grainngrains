import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus, RotateCcw } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { combosView, deletedCombos } from "@/src/lib/admin/queries";
import { dbReady } from "@/src/lib/db/supabase";
import { Badge, Card, DbNotice, Empty, PageHeader, btnPrimary, money } from "@/src/components/admin/ui";
import ProductToggle from "@/src/components/admin/ProductToggle";
import { restoreCombo } from "../actions/combos";

export const metadata: Metadata = { title: "Combos" };

const linkCls =
  "inline-flex items-center gap-1.5 border border-adm-line3 bg-adm-surface px-3 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-ink transition-colors hover:border-adm-strong";

export default async function CombosPage() {
  await requireAdmin();
  const [combos, deleted] = await Promise.all([combosView(), deletedCombos()]);
  const ready = dbReady();

  return (
    <>
      {!ready && <DbNotice />}
      <PageHeader
        kicker="Catálogo"
        title="Combos"
        description="Packs de cafés con descuento, cada uno en la presentación que elijas. Se recomiendan en el carrito y se cobran como un solo producto. Si un café del combo se oculta, el combo deja de mostrarse."
        actions={
          <Link href="/admin/combos/nuevo" className={btnPrimary}>
            <Plus size={16} /> Nuevo combo
          </Link>
        }
      />

      {combos.length === 0 ? (
        <Empty title="Sin combos" text="Crea el primero con «Nuevo combo»." />
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-adm-line">
            {combos.map((c) => (
              <li key={c.id} className={`flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 sm:flex-nowrap sm:px-7 ${c.active ? "" : "opacity-70"}`}>
                <Link href={`/admin/combos/${c.id}`} className="flex min-w-0 basis-full items-center gap-4 sm:flex-1 sm:basis-auto">
                  {/* Las latas del combo, una sobre otra */}
                  <span className="flex shrink-0 -space-x-4">
                    {c.items.slice(0, 4).map((i) => (
                      <span key={i.productId} className="relative h-14 w-11 overflow-hidden ring-2 ring-adm-surface" style={{ backgroundColor: i.cardBg }}>
                        {i.image && <Image src={i.image} alt="" fill sizes="44px" className="object-cover" />}
                      </span>
                    ))}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{c.name}</span>
                      <Badge status={c.active ? "active" : "paused"} />
                      {c.custom && <span className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-cyan-ink">nuevo</span>}
                    </span>
                    {c.hidden && <span className="mt-1 block text-xs font-medium text-adm-red">No se muestra en la web: tiene un café oculto.</span>}
                    <span className="mt-1 block truncate text-xs text-adm-muted">{c.items.map((i) => `${i.name} (${i.sizeLabel})`).join(" · ")}</span>
                  </span>
                </Link>
                <div className="flex w-full items-center gap-4 border-t border-adm-line pt-3 sm:w-auto sm:border-0 sm:pt-0">
                  <div className="text-xs sm:text-right">
                    <p className="text-sm font-semibold tabular-nums">{money(c.price)}</p>
                    <p className="tabular-nums text-adm-muted"><span className="line-through">{money(c.regular)}</span> · −{c.discount}%</p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <ProductToggle id={c.id} active={c.active} disabled={!ready} kind="combo" />
                    <Link href={`/admin/combos/${c.id}`} className={linkCls}><Pencil size={12} /> Editar</Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {deleted.length > 0 && (
        <Card title="Eliminados" padded={false} className="mt-4">
          <ul className="divide-y divide-adm-line">
            {deleted.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-7">
                <span className="text-sm">{c.name}</span>
                <form action={restoreCombo.bind(null, c.id)}>
                  <button className={linkCls}><RotateCcw size={12} /> Restaurar</button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
