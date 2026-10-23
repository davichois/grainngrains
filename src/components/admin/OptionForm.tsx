import { LOCALES, LOCALE_NAMES, translationConfig } from "@/src/lib/admin/texts";
import AutoTranslate from "./AutoTranslate";
import { saveCoffeeOption } from "@/src/app/admin/(panel)/actions/options";
import ActionForm from "./ActionForm";
import { Card, fieldCls, labelCls } from "./ui";

/** Formulario de una varietal o un proceso (nuevo sin `id`) */
export default async function OptionForm({
  kind,
  id,
  names,
  sort,
  active = true,
}: {
  kind: "varietals" | "processes";
  id?: string;
  names?: Record<string, { value: string }>;
  sort?: number | null;
  active?: boolean;
}) {
  const one = kind === "varietals" ? "varietal" : "proceso";
  const tr = await translationConfig();
  return (
    <ActionForm action={saveCoffeeOption} submit={id ? "Guardar" : `Crear ${one}`} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id ?? ""} />
      <Card title="Datos">
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <label className="flex cursor-pointer items-center justify-between gap-3 border border-adm-line px-4 py-3.5 hover:border-adm-faint">
            <span>
              <span className="block font-semibold">Activa</span>
              <span className="text-xs text-adm-muted">Inactiva, no se ofrece en ningún café (aunque lo tenga marcado).</span>
            </span>
            <input type="checkbox" name="active" defaultChecked={active} className="h-6 w-6 accent-[#0FC0FC]" />
          </label>
          <label className="block">
            <span className={labelCls}>Orden</span>
            <input name="sort" inputMode="numeric" defaultValue={sort ?? ""} placeholder="Auto" className={fieldCls} />
          </label>
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
              hint: kind === "varietals" ? "coffee varietal (plant variety) name" : "coffee processing method name",
              values: Object.fromEntries(LOCALES.map((l) => [l, names?.[l]?.value ?? ""])),
              max: 60,
              required: true,
              wide: true,
              placeholder: kind === "varietals" ? "Geisha" : "Lavado",
            }]}
          />
        ) : (<>
        <p className="mb-4 text-xs text-adm-muted">El español es obligatorio; si dejas un idioma vacío, se muestra el español.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {LOCALES.map((l) => (
            <label key={l} className={`block ${l === "es" ? "sm:col-span-2" : ""}`}>
              <span className={labelCls}>{LOCALE_NAMES[l]}{l === "es" && " · obligatorio"}</span>
              <input
                name={`name_${l}`}
                defaultValue={l !== "es" && names?.[l]?.value === names?.es?.value ? "" : names?.[l]?.value ?? ""}
                placeholder={l === "es" ? (kind === "varietals" ? "Geisha" : "Lavado") : names?.es?.value}
                required={l === "es"}
                maxLength={60}
                className={fieldCls}
              />
            </label>
          ))}
        </div>
        </>)}
      </Card>
    </ActionForm>
  );
}
