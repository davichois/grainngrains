import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { productsView, listTextOverrides } from "@/src/lib/admin/queries";
import { textsFor } from "@/src/lib/admin/texts";
import { dbReady } from "@/src/lib/db/supabase";
import { DbNotice, btnDanger, btnGhost } from "@/src/components/admin/ui";
import ActionForm from "@/src/components/admin/ActionForm";
import EditionForm from "@/src/components/admin/EditionForm";
import { deleteEdition } from "../../../actions/products";

export const metadata: Metadata = { title: "Editar edición" };

export default async function EditionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [editionsList] = await Promise.all([productsView(), listTextOverrides()]);
  const edition = editionsList.find((e) => e.id === id);
  if (!edition) notFound();
  const [name, bigBot, subtitle] = await Promise.all([
    textsFor(`editions.${id}.name`),
    textsFor(`editions.${id}.bigBot`),
    textsFor(`editions.${id}.subtitle`),
  ]);
  const ready = dbReady();

  return (
    <>
      {!ready && <DbNotice />}
      <Link href="/admin/productos" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Productos
      </Link>

      <header className="mb-8 flex flex-col gap-5 border-b border-adm-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="h-14 w-14 shrink-0" style={{ backgroundColor: edition.panelBg }} />
          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-adm-faint">
              Edición · {edition.custom ? "Creada en el panel" : "Del código"} · {edition.products.length} café{edition.products.length === 1 ? "" : "s"}
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{edition.name}</h1>
          </div>
        </div>
        {ready && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/productos/nuevo?edicion=${id}`} className={btnGhost}><Plus size={14} /> Agregar café</Link>
            <ActionForm
              action={deleteEdition.bind(null, id)}
              submit={<><Trash2 size={14} /> Eliminar</>}
              submitClass={btnDanger}
              className=""
              confirm={`¿Eliminar "${edition.name}"? ${edition.custom ? "Se borra para siempre (debe estar sin cafés)." : "Sus cafés dejan de verse; podrás restaurarla desde Productos."}`}
            >
              {null}
            </ActionForm>
          </div>
        )}
      </header>

      <EditionForm edition={edition} texts={{ name, bigBot, subtitle }} />
    </>
  );
}
