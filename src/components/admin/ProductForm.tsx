import { CERTIFICATIONS } from "@/src/components/product-showcase/data";
import Link from "next/link";
import type { CoffeeOptionView, EditionView, ProductView, SizeView } from "@/src/lib/admin/queries";
import { LOCALES, LOCALE_NAMES, translationConfig } from "@/src/lib/admin/texts";
import AutoTranslate from "./AutoTranslate";
import { DEFAULT_SIZE } from "@/src/lib/shop";
import { saveProduct } from "@/src/app/admin/(panel)/actions/products";
import ActionForm from "./ActionForm";
import ColorField from "./ColorField";
import OptionPicker from "./OptionPicker";
import FileField from "./FileField";
import { publicImages } from "@/src/lib/admin/public-images";
import Select from "./Select";
import { Card, fieldCls, labelCls } from "./ui";

type Names = Record<string, { value: string; edited: boolean }>;

const checkCls =
  "flex cursor-pointer items-center gap-2.5 border border-adm-line px-3.5 py-2.5 text-[0.8125rem] font-medium transition-colors hover:border-adm-faint";

/** Formulario de un café: nuevo (sin `product`) o existente */
export default async function ProductForm({
  product: p,
  editions,
  sizes,
  names,
  defaultEdition,
  options,
}: {
  product?: ProductView;
  editions: EditionView[];
  sizes: SizeView[];
  names?: Names;
  defaultEdition?: string;
  /** Listas de varietales y procesos del panel */
  options: { varietals: CoffeeOptionView[]; processes: CoffeeOptionView[] };
}) {
  const canUpload = Boolean(process.env.N8N_UPLOAD_WEBHOOK_URL);
  const tr = await translationConfig();
  const library = publicImages();
  /* Un idioma que solo repite el español se muestra vacío (con el español de guía) */
  const shown = (l: string) => {
    const v = names?.[l]?.value ?? "";
    return l !== "es" && p?.custom && v === names?.es?.value ? "" : v;
  };

  return (
    <ActionForm action={saveProduct} submit={p ? "Guardar café" : "Crear café"} className="space-y-4">
      <input type="hidden" name="id" value={p?.id ?? ""} />

      <Card title="Datos">
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center justify-between gap-3 border border-adm-line px-4 py-3.5 hover:border-adm-faint">
            <span>
              <span className="block font-semibold">A la venta</span>
              <span className="text-xs text-adm-muted">Si lo apagas, el café no aparece en la web.</span>
            </span>
            <input type="checkbox" name="active" defaultChecked={p ? p.active : true} className="h-6 w-6 accent-[#0FC0FC]" />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 border border-adm-line px-4 py-3.5 hover:border-adm-faint has-checked:border-adm-red-line">
            <span>
              <span className="block font-semibold">Agotado</span>
              <span className="text-xs text-adm-muted">
                Se sigue viendo en la web con el sello «Agotado», pero nadie lo puede comprar. Para agotar solo una presentación o una varietal, márcalo abajo.
              </span>
            </span>
            <input type="checkbox" name="sold_out" defaultChecked={p?.soldOut ?? false} className="h-6 w-6 shrink-0 accent-[#E5484D]" />
          </label>

          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <label className="block">
              <span className={labelCls}>Edición</span>
              <Select name="edition" defaultValue={p?.categoryId ?? defaultEdition ?? editions[0]?.id} className={fieldCls} aria-label="Edición">
                {editions.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className={labelCls}>Orden</span>
              <input name="sort" inputMode="numeric" defaultValue={p?.sort ?? ""} placeholder="Auto" className={fieldCls} />
            </label>
          </div>
        </div>
      </Card>

      <Card title="Nombre">
        {!tr.manual ? (
          <AutoTranslate
            locales={tr.locales}
            canTranslate={tr.canTranslate}
            fields={[{
              name: "name",
              label: "Nombre",
              hint: "name of a specialty coffee product (usually the farm or producer)",
              values: Object.fromEntries(LOCALES.map((l) => [l, names?.[l]?.value ?? ""])),
              max: 120,
              required: true,
              wide: true,
            }]}
          />
        ) : (<>
        <p className="mb-4 text-xs text-adm-muted">
          El español es obligatorio. Completa los demás idiomas a mano; si dejas uno vacío, ese idioma muestra el nombre en español.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {LOCALES.map((l) => (
            <label key={l} className={`block ${l === "es" ? "sm:col-span-2" : ""}`}>
              <span className={labelCls}>
                {LOCALE_NAMES[l]} {l === "es" && "· obligatorio"}
                {p && !p.custom && names?.[l]?.edited && <span className="ml-1 normal-case tracking-normal text-adm-cyan-ink">· editado</span>}
              </span>
              <input
                name={`name_${l}`}
                defaultValue={shown(l)}
                placeholder={l === "es" ? "" : names?.es?.value}
                required={l === "es"}
                maxLength={120}
                className={fieldCls}
              />
            </label>
          ))}
        </div>
        </>)}
      </Card>

      <Card title="Precio y stock por presentación">
        <p className="mb-4 text-xs text-adm-muted">
          250 g es obligatoria. En las demás, si dejas el precio vacío, el café no se vende en esa presentación. Stock vacío = sin límite.
          Con 0 unidades, o marcada como agotada, la presentación sale «Agotado».
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {sizes.map((s) => (
            <div key={s.id} className="border border-adm-line p-4">
              <p className="text-lg font-semibold">
                {s.label}
                {s.id === DEFAULT_SIZE && <span className="ml-2 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-adm-faint">obligatoria</span>}
              </p>
              <label className="mt-3 block">
                <span className={labelCls}>Precio (S/)</span>
                <input
                  name={`price_${s.id}`}
                  inputMode="decimal"
                  required={s.id === DEFAULT_SIZE}
                  defaultValue={p?.prices[s.id] ?? ""}
                  placeholder={s.id === DEFAULT_SIZE ? "" : "No se vende"}
                  className={fieldCls}
                />
              </label>
              <label className="mt-3 block">
                <span className={labelCls}>Unidades disponibles</span>
                <input name={`stock_${s.id}`} inputMode="numeric" defaultValue={p?.stock?.[s.id] ?? ""} placeholder="Sin límite" className={fieldCls} />
              </label>
              <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-[0.8125rem] font-medium">
                <input type="checkbox" name={`sold_out_${s.id}`} defaultChecked={p?.soldOutSizes.includes(s.id) ?? false} className="h-4 w-4 accent-[#E5484D]" />
                Agotada (sin importar las unidades)
              </label>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Varietales y procesos">
        <p className="mb-4 text-xs text-adm-muted">
          Elige de la lista las que tiene este café y, de esas, cuáles ve el cliente al comprar (elige una varietal y un proceso).
          No cambian el precio. Si se te acaba una, márcala como agotada: el cliente la ve tachada y no la puede elegir.{" "}
          <Link href="/admin/opciones" className="font-semibold text-adm-cyan-ink underline underline-offset-2">Administrar listas</Link>
        </p>
        <div className="space-y-6">
          {(
            [
              ["varietals", "Varietales", options.varietals, p?.varietals ?? []],
              ["processes", "Procesos", options.processes, p?.processes ?? []],
            ] as const
          ).map(([kind, title, list, current]) =>
            list.length === 0 ? (
              <p key={kind} className="text-[0.8125rem] text-adm-muted">
                No hay {title.toLowerCase()} todavía.{" "}
                <Link href={`/admin/opciones${kind === "processes" ? "?tipo=procesos" : ""}`} className="font-semibold text-adm-cyan-ink underline underline-offset-2">Créalos aquí</Link>.
              </p>
            ) : (
              <OptionPicker
                key={kind}
                kind={kind}
                title={title}
                options={list.map((o) => ({ id: o.id, label: o.label, active: o.active }))}
                initial={current}
              />
            ),
          )}
        </div>
      </Card>

      <Card title="Fotos y tarjeta">
        <div className="space-y-4">
          <FileField name="image" label="Foto principal" defaultValue={p?.image} folder="productos" canUpload={canUpload} library={library} />
          <FileField name="hover_image" label="Foto al pasar el mouse (opcional)" defaultValue={p?.hoverImage} folder="productos" canUpload={canUpload} library={library} />
          <ColorField
            name="card_bg"
            label="Color de fondo de la tarjeta"
            defaultValue={p?.ownCardBg}
            optional
            hint="Vacío = el color de la edición."
          />
          <fieldset>
            <legend className={`${labelCls} mb-2`}>Sellos</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CERTIFICATIONS).map(([id, c]) => (
                <label key={id} className={checkCls}>
                  <input
                    type="checkbox"
                    name="certifications"
                    value={id}
                    defaultChecked={p ? p.certifications.includes(id as never) : true}
                    className="h-5 w-5 shrink-0 accent-[#0FC0FC]"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Card>
    </ActionForm>
  );
}
