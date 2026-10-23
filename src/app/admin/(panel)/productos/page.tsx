import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus, Ruler, RotateCcw } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { coffeeOptionsView, deletedCatalog, productsView, sizesView } from "@/src/lib/admin/queries";
import { dbReady } from "@/src/lib/db/supabase";
import { Card, DbNotice, Empty, PageHeader, btnGhost, btnPrimary, money } from "@/src/components/admin/ui";
import ProductToggle from "@/src/components/admin/ProductToggle";
import { DragCoffee, EditionDnd, EditionDrop } from "@/src/components/admin/EditionDnd";
import { restoreEdition, restoreProduct } from "../actions/products";

export const metadata: Metadata = { title: "Productos y stock" };

const linkCls =
  "inline-flex items-center gap-1.5 border border-adm-line3 bg-adm-surface px-3 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-ink transition-colors hover:border-adm-strong";

function StockPill({ n }: { n: number | null | undefined }) {
  if (n === null || n === undefined)
    return <span className="border border-adm-line2 px-2 py-0.5 text-[0.6875rem] font-semibold text-adm-faint">∞</span>;
  return (
    <span
      className={`border px-2 py-0.5 text-[0.6875rem] font-semibold tabular-nums ${
        n === 0 ? "border-adm-red-line text-adm-red" : n <= 5 ? "border-adm-cyan-line bg-adm-cyan-tint text-adm-cyan-ink" : "border-adm-line2 text-adm-sub"
      }`}
    >
      {n === 0 ? "Agotado" : `${n} u.`}
    </span>
  );
}

export default async function ProductsPage() {
  await requireAdmin();
  const [editions, sizes, deleted, varietals, processes] = await Promise.all([
    productsView(),
    sizesView(),
    deletedCatalog(),
    coffeeOptionsView("varietals"),
    coffeeOptionsView("processes"),
  ]);
  const label = new Map(sizes.map((s) => [s.id, s.label]));
  const optName = new Map([...varietals, ...processes].map((o) => [o.id, o.label]));
  const optText = (list: { id: string; active: boolean }[]) =>
    list
      .filter((o) => optName.has(o.id))
      .map((o) => `${optName.get(o.id)}${o.active ? "" : " (oculta)"}`)
      .join(", ");
  const ready = dbReady();

  return (
    <>
      {!ready && <DbNotice />}
      <PageHeader
        kicker="Catálogo"
        title="Productos y stock"
        description="Ediciones, cafés, precios, stock y presentaciones. El stock baja solo con cada pedido pagado; sin número, no tiene límite. Lo oculto no aparece en la web."
        actions={
          <>
            <Link href="/admin/productos/nuevo" className={btnPrimary}><Plus size={14} /> Nuevo café</Link>
            <Link href="/admin/productos/ediciones/nueva" className={btnGhost}><Plus size={14} /> Nueva edición</Link>
            <Link href="/admin/productos/presentaciones" className={btnGhost}><Ruler size={14} /> Presentaciones</Link>
          </>
        }
      />

      <EditionDnd disabled={!ready}>
      {ready && editions.length > 1 && (
        <p className="mb-4 text-xs text-adm-muted">Para cambiar un café de edición, arrástralo desde ⋮⋮ y suéltalo sobre otra edición.</p>
      )}
      <div className="space-y-4">
        {editions.map((e) => (
          <EditionDrop key={e.id} id={e.id}>
          <Card
            padded={false}
            className={e.active ? "" : "opacity-70"}
            title={
              <span className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: e.color }} />
                {e.name}
                {e.custom && <span className="text-adm-cyan-ink">· nueva</span>}
                {!e.active && <span className="text-adm-red">· oculta</span>}
              </span>
            }
            aside={
              <div className="flex items-center gap-2">
                <ProductToggle id={e.id} active={e.active} disabled={!ready} kind="edition" />
                <Link href={`/admin/productos/ediciones/${e.id}`} className={linkCls}><Pencil size={12} /> Edición</Link>
                <span className="hidden sm:inline-flex"><Link href={`/admin/productos/nuevo?edicion=${e.id}`} className={linkCls}><Plus size={12} /> Café</Link></span>
              </div>
            }
          >
            {e.products.length === 0 ? (
              <p className="px-5 py-6 text-[0.8125rem] text-adm-soft sm:px-7">
                Sin cafés todavía (no se muestra en la web).{" "}
                <Link href={`/admin/productos/nuevo?edicion=${e.id}`} className="font-semibold text-adm-cyan-ink underline underline-offset-2">Agregar el primero</Link>
              </p>
            ) : (
              <ul className="divide-y divide-adm-line">
                {e.products.map((p) => (
                  <DragCoffee
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    edition={e.id}
                    disabled={!ready || editions.length < 2}
                    className={`flex flex-wrap items-center gap-4 px-5 py-4 sm:px-7 ${p.active ? "" : "opacity-60"}`}
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden" style={{ backgroundColor: p.cardBg }}>
                      {p.image && <Image src={p.image} alt="" fill sizes="64px" className="object-cover" />}
                    </div>
                    <div className="min-w-[11rem] flex-1">
                      <p className="truncate font-semibold">
                        {p.name}
                        {p.custom && <span className="ml-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-cyan-ink">nuevo</span>}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                        {sizes
                          .filter((s) => Number(p.prices[s.id]) > 0)
                          .map((s) => (
                            <span key={s.id} className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="font-bold">{label.get(s.id)}</span>
                              <span className="tabular-nums text-adm-sub">{money(p.prices[s.id])}</span>
                              <StockPill n={p.stock?.[s.id]} />
                            </span>
                          ))}
                      </div>
                      {(optText(p.varietals) || optText(p.processes)) && (
                        <p className="mt-1.5 text-xs text-adm-muted">
                          {optText(p.varietals) && <><span className="font-semibold text-adm-sub">Varietales:</span> {optText(p.varietals)}</>}
                          {optText(p.varietals) && optText(p.processes) && " · "}
                          {optText(p.processes) && <><span className="font-semibold text-adm-sub">Procesos:</span> {optText(p.processes)}</>}
                        </p>
                      )}
                    </div>
                    <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
                      <ProductToggle id={p.id} active={p.active} disabled={!ready} />
                      <Link href={`/admin/productos/${p.id}`} className={linkCls}><Pencil size={12} /> Editar</Link>
                    </div>
                  </DragCoffee>
                ))}
              </ul>
            )}
          </Card>
          </EditionDrop>
        ))}
        {editions.length === 0 && <Empty title="Sin ediciones" text="Crea una edición y agrégale cafés." />}

        {(deleted.editions.length > 0 || deleted.products.length > 0) && (
          <Card title="Eliminados" padded={false}>
            <ul className="divide-y divide-adm-line">
              {deleted.editions.map((e) => (
                <li key={`e-${e.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-7">
                  <span className="text-sm"><span className="mr-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-faint">Edición</span>{e.name}</span>
                  <form action={restoreEdition.bind(null, e.id)}>
                    <button className={linkCls}><RotateCcw size={12} /> Restaurar</button>
                  </form>
                </li>
              ))}
              {deleted.products.map((p) => (
                <li key={`p-${p.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-7">
                  <span className="text-sm"><span className="mr-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-faint">{p.edition}</span>{p.name}</span>
                  <form action={restoreProduct.bind(null, p.id)}>
                    <button className={linkCls}><RotateCcw size={12} /> Restaurar</button>
                  </form>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
      </EditionDnd>
    </>
  );
}
