import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { sizesView } from "@/src/lib/admin/queries";
import { LOCALES, LOCALE_NAMES, textsFor, translationConfig } from "@/src/lib/admin/texts";
import AutoTranslate from "@/src/components/admin/AutoTranslate";
import { dbReady } from "@/src/lib/db/supabase";
import { Card, DbNotice, PageHeader, btnDanger, fieldCls, labelCls } from "@/src/components/admin/ui";
import ActionForm from "@/src/components/admin/ActionForm";
import { deleteSize, saveSize } from "../../actions/products";

export const metadata: Metadata = { title: "Presentaciones" };

/** Nombre de la presentación en cada idioma + orden */
async function SizeFields({ labels, sort, code }: { labels?: Record<string, { value: string }>; sort?: number | null; code?: boolean }) {
  const tr = await translationConfig();
  if (!tr.manual)
    return (
      <div className="space-y-3">
        <AutoTranslate
          locales={tr.locales}
          canTranslate={tr.canTranslate}
          fields={[{
            name: "label",
            label: "Nombre",
            hint: "coffee bag size label, e.g. a weight like 500 g",
            values: Object.fromEntries(LOCALES.map((l) => [l, labels?.[l]?.value ?? ""])),
            max: 40,
            required: true,
            placeholder: "500 g",
          }]}
        />
        {!code && (
          <label className="block sm:w-48">
            <span className={labelCls}>Orden</span>
            <input name="sort" inputMode="numeric" defaultValue={sort ?? ""} placeholder="Auto" className={fieldCls} />
          </label>
        )}
      </div>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {LOCALES.map((l) => (
        <label key={l} className="block">
          <span className={labelCls}>{LOCALE_NAMES[l]}{l === "es" && " · obligatorio"}</span>
          <input name={`label_${l}`} defaultValue={labels?.[l]?.value ?? ""} required={l === "es"} maxLength={40} placeholder={l === "es" ? "500 g" : ""} className={fieldCls} />
        </label>
      ))}
      {!code && (
        <label className="block">
          <span className={labelCls}>Orden</span>
          <input name="sort" inputMode="numeric" defaultValue={sort ?? ""} placeholder="Auto" className={fieldCls} />
        </label>
      )}
    </div>
  );
}

export default async function SizesPage() {
  await requireAdmin();
  const sizes = await sizesView();
  const labels = await Promise.all(sizes.map((s) => textsFor(`shop.sizes.${s.id}`)));
  const ready = dbReady();

  return (
    <>
      {!ready && <DbNotice />}
      <Link href="/admin/productos" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Productos
      </Link>
      <PageHeader
        kicker="Catálogo"
        title="Presentaciones"
        description="Los tamaños en que se venden los cafés. Después de crear una, ponle precio en cada café que se venda así; sin precio, el café no se ofrece en esa presentación."
      />

      <div className="space-y-4">
        {sizes.map((s, i) => (
          <Card
            key={s.id}
            title={<span>{s.label} <span className="ml-2 text-adm-faint">{s.code ? "del código" : "creada en el panel"}</span></span>}
            aside={
              !s.code && ready ? (
                <ActionForm
                  action={deleteSize.bind(null, s.id)}
                  submit={<><Trash2 size={13} /> Eliminar</>}
                  submitClass={btnDanger}
                  className=""
                  confirm={`¿Eliminar la presentación "${s.label}"? Los cafés dejan de venderse en ese tamaño.`}
                >
                  {null}
                </ActionForm>
              ) : undefined
            }
          >
            <ActionForm action={saveSize} submit="Guardar">
              <input type="hidden" name="id" value={s.id} />
              <SizeFields labels={labels[i]} sort={s.sort} code={s.code} />
            </ActionForm>
          </Card>
        ))}

        <Card title="Nueva presentación">
          <ActionForm action={saveSize} submit="Crear presentación">
            <input type="hidden" name="id" value="" />
            <SizeFields />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
