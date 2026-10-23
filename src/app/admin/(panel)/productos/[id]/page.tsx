import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { coffeeOptionsView, productsView, sizesView, listTextOverrides } from "@/src/lib/admin/queries";
import { textsFor } from "@/src/lib/admin/texts";
import { dbReady } from "@/src/lib/db/supabase";
import { baseCategories } from "@/src/lib/site-data/apply";
import { DbNotice, btnDanger, btnGhost, money } from "@/src/components/admin/ui";
import ActionForm from "@/src/components/admin/ActionForm";
import ProductForm from "@/src/components/admin/ProductForm";
import { deleteProduct, resetProduct } from "../../actions/products";

export const metadata: Metadata = { title: "Editar café" };

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [editions, sizes, varietals, processes] = await Promise.all([
    productsView(),
    sizesView(),
    coffeeOptionsView("varietals"),
    coffeeOptionsView("processes"),
    listTextOverrides(),
  ]);
  const edition = editions.find((e) => e.products.some((p) => p.id === id));
  const p = edition?.products.find((x) => x.id === id);
  if (!edition || !p) notFound();
  /* Un café del código que se movió de edición toma sus nombres originales de la suya */
  const codeEdition = baseCategories().find((c) => c.products.some((x) => x.id === p.id))?.id;
  const names = await textsFor(
    `editions.${edition.id}.products.${p.id}`,
    codeEdition && codeEdition !== edition.id ? `editions.${codeEdition}.products.${p.id}` : undefined,
  );
  const ready = dbReady();

  return (
    <>
      {!ready && <DbNotice />}
      <Link href="/admin/productos" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Productos
      </Link>

      <header className="mb-8 flex flex-col gap-5 border-b border-adm-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden" style={{ backgroundColor: p.cardBg }}>
            {p.image && <Image src={p.image} alt="" fill sizes="96px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-adm-faint">
              {edition.name} · {p.custom ? "Creado en el panel" : "Del código"}
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{p.name}</h1>
            {p.codePrices && (
              <p className="mt-1 text-xs text-adm-soft">
                Precio del código: {Object.entries(p.codePrices).map(([s, v]) => `${s} ${money(v)}`).join(" · ")}
              </p>
            )}
          </div>
        </div>
        {ready && (
          <div className="flex flex-wrap gap-2">
            {p.hasOverride && (
              <form action={resetProduct.bind(null, p.id)}>
                <button className={btnGhost}><RotateCcw size={14} /> Datos del código</button>
              </form>
            )}
            <ActionForm
              action={deleteProduct.bind(null, p.id)}
              submit={<><Trash2 size={14} /> Eliminar</>}
              submitClass={btnDanger}
              className=""
              confirm={`¿Eliminar "${p.name}"? ${p.custom ? "Se borra para siempre." : "Podrás restaurarlo desde Productos."}`}
            >
              {null}
            </ActionForm>
          </div>
        )}
      </header>

      <ProductForm product={p} editions={editions} sizes={sizes} names={names} options={{ varietals, processes }} />
    </>
  );
}
