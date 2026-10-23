import type { EditionView } from "@/src/lib/admin/queries";
import { LOCALES, LOCALE_NAMES, translationConfig } from "@/src/lib/admin/texts";
import AutoTranslate from "./AutoTranslate";
import { NEW_EDITION_COLORS } from "@/src/lib/site-data/apply";
import { saveEdition } from "@/src/app/admin/(panel)/actions/products";
import ActionForm from "./ActionForm";
import ColorField from "./ColorField";
import FileField from "./FileField";
import { publicImages } from "@/src/lib/admin/public-images";
import { Card, fieldCls, labelCls } from "./ui";

type Texts = Record<string, { value: string; edited: boolean }>;

/** Formulario de una edición: nueva (sin `edition`) o existente */
export default async function EditionForm({
  edition: e,
  texts,
}: {
  edition?: EditionView;
  texts?: { name: Texts; bigBot: Texts; subtitle: Texts };
}) {
  /* Un idioma que solo repite el español se muestra vacío (con el español de guía) */
  const v = (field: "name" | "bigBot" | "subtitle", l: string) => {
    const value = texts?.[field][l]?.value ?? "";
    return l !== "es" && e?.custom && value === texts?.[field].es?.value ? "" : value;
  };
  const hint = (field: "name" | "bigBot" | "subtitle", l: string) => (l === "es" ? undefined : texts?.[field].es?.value);
  const tr = await translationConfig();
  const all = (field: "name" | "bigBot" | "subtitle") => Object.fromEntries(LOCALES.map((l) => [l, texts?.[field][l]?.value ?? ""]));

  return (
    <ActionForm action={saveEdition} submit={e ? "Guardar edición" : "Crear edición"} className="space-y-4">
      <input type="hidden" name="id" value={e?.id ?? ""} />

      <Card title="Datos">
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <label className="flex cursor-pointer items-center justify-between gap-3 border border-adm-line px-4 py-3.5 hover:border-adm-faint">
            <span>
              <span className="block font-semibold">Visible en la web</span>
              <span className="text-xs text-adm-muted">Apagada, sus cafés no aparecen. Una edición sin cafés tampoco se muestra.</span>
            </span>
            <input type="checkbox" name="active" defaultChecked={e ? e.active : true} className="h-6 w-6 accent-[#0FC0FC]" />
          </label>
          <label className="block">
            <span className={labelCls}>Orden</span>
            <input name="sort" inputMode="numeric" defaultValue={e?.sort ?? ""} placeholder="Auto" className={fieldCls} />
          </label>
        </div>
      </Card>

      <Card title="Textos">
        {!tr.manual ? (
          <>
            <p className="mb-4 text-xs text-adm-muted">
              La palabra grande es la que aparece gigante en el slider de productos (p. ej. CAFICULTORES).
            </p>
            <AutoTranslate
              locales={tr.locales}
              canTranslate={tr.canTranslate}
              columns="sm:grid-cols-[1fr_12rem]"
              fields={[
                { name: "name", label: "Nombre", hint: "name of a coffee collection/edition shown as a title", values: all("name"), max: 80, required: true, placeholder: "Edición …" },
                { name: "bigBot", label: "Palabra grande", hint: "one or two big UPPERCASE words shown huge in a product slider", values: all("bigBot"), max: 24, required: true, uppercase: true },
                { name: "subtitle", label: "Descripción", hint: "short description of the coffee edition", values: all("subtitle"), max: 600, multiline: true, wide: true },
              ]}
            />
          </>
        ) : (<>
        <p className="mb-4 text-xs text-adm-muted">
          El español es obligatorio (nombre y palabra grande). Si dejas un idioma vacío, ese idioma muestra el texto en español.
          La palabra grande es la que aparece gigante en el slider de productos (p. ej. CAFICULTORES).
        </p>
        <div className="divide-y divide-adm-line border-y border-adm-line">
          {LOCALES.map((l) => (
            <fieldset key={l} className="grid gap-3 py-5 sm:grid-cols-[7rem_1fr]">
              <legend className="sr-only">{LOCALE_NAMES[l]}</legend>
              <p className="pt-2 text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-adm-ink">
                {LOCALE_NAMES[l]}
                {l === "es" && <span className="block text-adm-faint">obligatorio</span>}
              </p>
              <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
                <label className="block">
                  <span className={labelCls}>Nombre</span>
                  <input name={`name_${l}`} defaultValue={v("name", l)} required={l === "es"} maxLength={80} placeholder={l === "es" ? "Edición …" : hint("name", l)} className={fieldCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>Palabra grande</span>
                  <input name={`bigBot_${l}`} defaultValue={v("bigBot", l)} required={l === "es"} maxLength={24} placeholder={hint("bigBot", l)} className={`${fieldCls} uppercase`} />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Descripción</span>
                  <textarea name={`subtitle_${l}`} defaultValue={v("subtitle", l)} rows={2} maxLength={600} placeholder={hint("subtitle", l)} className={fieldCls} />
                </label>
              </div>
            </fieldset>
          ))}
        </div>
        </>)}
      </Card>

      <Card title="Colores e imagen">
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField name="color" label="Color de la edición" defaultValue={e?.color ?? NEW_EDITION_COLORS.color} hint="Fondo de las tarjetas de sus cafés y el punto de la edición." />
          <ColorField name="panel_bg" label="Fondo del slider" defaultValue={e?.panelBg ?? NEW_EDITION_COLORS.panelBg} hint="Se ve si no hay imagen." />
          <ColorField name="hero_text_color" label="Color de la palabra grande" defaultValue={e?.heroTextColor ?? NEW_EDITION_COLORS.heroTextColor} />
          <ColorField name="heading_color" label="Color del título" defaultValue={e?.headingColor ?? NEW_EDITION_COLORS.headingColor} />
          <div className="sm:col-span-2">
            <FileField
              name="panel_image"
              label="Imagen del slider (opcional)"
              defaultValue={e?.panelImage}
              folder="ediciones"
              canUpload={Boolean(process.env.N8N_UPLOAD_WEBHOOK_URL)}
              library={publicImages()}
            />
          </div>
        </div>
      </Card>
    </ActionForm>
  );
}
