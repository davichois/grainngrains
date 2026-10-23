"use client";

import { useState } from "react";
import type { Coupon, CouponRules } from "@/src/lib/coupons";
import ActionForm from "./ActionForm";
import { fieldCls, labelCls } from "./ui";
import { saveCoupon } from "@/src/app/admin/(panel)/actions/coupons";
import Select from "./Select";

const REWARDS = [
  ["percent", "% de descuento en la compra"],
  ["fixed", "Monto fijo de descuento (S/)"],
  ["fixedPer", "S/ X por cada S/ Y de compra"],
  ["percentItem", "% en una sola bolsa (más barata o más cara)"],
  ["fixedPrice", "Precio especial por bolsa"],
  ["buyXgetY", "Lleva / paga (2x1, 3x2, 2.ª al 50%…)"],
  ["gift", "Café de regalo"],
  ["freeShipping", "Envío gratis"],
  ["shippingDiscount", "S/ menos en el envío"],
  ["shippingPercent", "% menos en el envío"],
  ["shippingFixed", "Envío a precio fijo"],
  ["tiered", "Escalas (más compras, más descuento)"],
] as const;

/* Reglas que tienen campo propio; el resto va en "avanzadas" (JSON) */
const UI_RULES: (keyof CouponRules)[] = [
  "minSubtotal", "maxSubtotal", "minQty", "validFrom", "validUntil", "maxUses",
  "maxUsesPerCustomer", "maxUsesPerDay", "budget", "maxDiscount", "firstPurchase",
  "newsletter", "excludeCombos", "consumerOnly", "wholesale", "paymentMethods",
  "zones", "editions", "customers",
];

const Num = ({ name, label, value, hint, step = "any" }: { name: string; label: string; value?: number; hint?: string; step?: string }) => (
  <label className="block">
    <span className={labelCls}>{label}</span>
    <input name={name} type="number" min={0} step={step} defaultValue={value ?? ""} placeholder={hint} className={fieldCls} />
  </label>
);

const Check = ({ name, label, checked, value }: { name: string; label: string; checked?: boolean; value?: string }) => (
  <label className="flex cursor-pointer items-center gap-2.5 border border-adm-line px-3.5 py-2.5 text-[0.8125rem] font-medium transition-colors hover:border-adm-faint">
    <input type="checkbox" name={name} value={value ?? "on"} defaultChecked={checked} className="h-5 w-5 shrink-0 accent-[#0FC0FC]" />
    {label}
  </label>
);

const toLocal = (v?: string) => (v ? v.replace(" ", "T").slice(0, 16) : "");

export default function CouponForm({
  coupon,
  products,
  editions,
  sizes,
}: {
  coupon?: Coupon;
  products: { value: string; label: string }[];
  editions: { id: string; name: string }[];
  sizes: { id: string; label: string }[];
}) {
  const r = coupon?.reward;
  const rules = coupon?.rules ?? {};
  const [type, setType] = useState<string>(r?.type ?? "percent");
  const v = (k: string) => (r as Record<string, unknown> | undefined)?.[k] as number | undefined;
  const advanced = Object.fromEntries(
    Object.entries(rules).filter(([k]) => !UI_RULES.includes(k as keyof CouponRules)),
  );
  const customersExtra =
    rules.customers && (rules.customers.domains?.length || rules.customers.documents?.length)
      ? { customers: { domains: rules.customers.domains, documents: rules.customers.documents } }
      : {};

  return (
    <ActionForm action={saveCoupon} submit={coupon ? "Guardar cambios" : "Crear cupón"} className="space-y-6">
      {coupon && <input type="hidden" name="original" value={coupon.code} />}

      <section className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Código</span>
          <input
            name="code"
            defaultValue={coupon?.code}
            disabled={Boolean(coupon)}
            required={!coupon}
            placeholder="CAFE20"
            pattern="[A-Za-z0-9_\-]{3,40}"
            className={`${fieldCls} tabular-nums tracking-wide uppercase`}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Otros códigos (alias)</span>
          <input name="aliases" defaultValue={coupon?.aliases?.join(", ")} placeholder="ANA20, LUIS20" className={`${fieldCls} tabular-nums tracking-wide uppercase`} />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Check name="active" label="Activo" checked={coupon ? coupon.active !== false : true} />
          <Check name="autoApply" label="Se aplica solo (sin escribir el código)" checked={coupon?.autoApply} />
          <Check name="stackable" label="Se suma con otras promociones" checked={coupon?.stackable} />
          <Check name="exclusive" label="No se combina con nada" checked={coupon?.exclusive} />
        </div>
      </section>

      <section className="border border-adm-line p-4 sm:p-5">
        <h3 className="mb-4 text-[0.625rem] font-semibold uppercase tracking-[0.25em] text-adm-muted">Premio</h3>
        <Select name="reward_type" value={type} onChange={(e) => setType(e.target.value)} className={`${fieldCls} cursor-pointer`}>
          {REWARDS.map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </Select>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(type === "percent" || type === "percentItem" || type === "shippingPercent") && (
            <Num name="r_value" label="Porcentaje (%)" value={v("value")} />
          )}
          {type === "percent" && <Num name="r_max" label="Tope de descuento (S/, opcional)" value={v("maxDiscount")} />}
          {(type === "fixed" || type === "fixedPer" || type === "shippingDiscount") && (
            <Num name="r_value" label="Monto (S/)" value={v("value")} />
          )}
          {type === "fixedPer" && <Num name="r_every" label="Por cada (S/ de compra)" value={v("every")} />}
          {type === "percentItem" && (
            <label className="block">
              <span className={labelCls}>¿En cuál bolsa?</span>
              <Select name="r_target" defaultValue={(r as { target?: string })?.target ?? "cheapest"} className={fieldCls}>
                <option value="cheapest">La más barata</option>
                <option value="mostExpensive">La más cara</option>
              </Select>
            </label>
          )}
          {(type === "fixedPrice" || type === "shippingFixed") && (
            <Num name="r_price" label={type === "fixedPrice" ? "Precio por bolsa (S/)" : "Costo del envío (S/)"} value={v("price")} />
          )}
          {type === "buyXgetY" && (
            <>
              <Num name="r_buy" label="Paga (bolsas)" value={v("buy") ?? 2} step="1" />
              <Num name="r_get" label="Con descuento (bolsas)" value={v("get") ?? 1} step="1" />
              <Num name="r_discount" label="Descuento de esas bolsas (%, vacío = gratis)" value={v("discount")} />
            </>
          )}
          {type === "gift" && (
            <>
              <label className="block sm:col-span-2">
                <span className={labelCls}>Café de regalo</span>
                <Select
                  name="r_gift"
                  defaultValue={r?.type === "gift" ? `${r.categoryId}/${r.productId}` : products[0]?.value}
                  className={fieldCls}
                >
                  {products.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </Select>
              </label>
              <label className="block">
                <span className={labelCls}>Presentación</span>
                <Select name="r_size" defaultValue={r?.type === "gift" ? r.size : "250g"} className={fieldCls}>
                  {sizes.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </Select>
              </label>
              <label className="block">
                <span className={labelCls}>Molienda</span>
                <Select name="r_grind" defaultValue={r?.type === "gift" ? r.grind : "wholeBean"} className={fieldCls}>
                  <option value="wholeBean">Grano entero</option>
                  <option value="coarse">Molido grueso</option>
                  <option value="medium">Molido medio</option>
                  <option value="fine">Molido fino</option>
                </Select>
              </label>
              <Num name="r_qty" label="Cantidad" value={v("qty") ?? 1} step="1" />
            </>
          )}
          {type === "tiered" && (
            <>
              <label className="block">
                <span className={labelCls}>Según</span>
                <Select name="r_by" defaultValue={r?.type === "tiered" ? r.by ?? "qty" : "qty"} className={fieldCls}>
                  <option value="qty">Cantidad de bolsas</option>
                  <option value="amount">Monto de compra (S/)</option>
                </Select>
              </label>
              <label className="block sm:col-span-2">
                <span className={labelCls}>Escalas (una por línea: mínimo:porcentaje)</span>
                <textarea
                  name="r_tiers"
                  rows={3}
                  defaultValue={r?.type === "tiered" ? r.tiers.map((t) => `${t.min}:${t.percent}`).join("\n") : "5:10\n10:15"}
                  className={`${fieldCls} tabular-nums tracking-wide`}
                />
              </label>
            </>
          )}
        </div>
      </section>

      <section className="border border-adm-line p-4 sm:p-5">
        <h3 className="mb-4 text-[0.625rem] font-semibold uppercase tracking-[0.25em] text-adm-muted">Condiciones</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className={labelCls}>Desde (hora de Lima)</span>
            <input type="datetime-local" name="validFrom" defaultValue={toLocal(rules.validFrom)} className={fieldCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Hasta (hora de Lima)</span>
            <input type="datetime-local" name="validUntil" defaultValue={toLocal(rules.validUntil)} className={fieldCls} />
          </label>
          <Num name="minSubtotal" label="Compra mínima (S/)" value={rules.minSubtotal} />
          <Num name="maxSubtotal" label="Compra máxima (S/)" value={rules.maxSubtotal} />
          <Num name="minQty" label="Mínimo de bolsas" value={rules.minQty} step="1" />
          <Num name="maxDiscount" label="Tope de descuento (S/)" value={rules.maxDiscount} />
          <Num name="maxUses" label="Usos en total" value={rules.maxUses} step="1" />
          <Num name="maxUsesPerCustomer" label="Usos por cliente" value={rules.maxUsesPerCustomer} step="1" />
          <Num name="maxUsesPerDay" label="Usos por día" value={rules.maxUsesPerDay} step="1" />
          <Num name="budget" label="Presupuesto total en descuentos (S/)" value={rules.budget} />
          <label className="block">
            <span className={labelCls}>Comprobante</span>
            <Select name="buyer" defaultValue={rules.consumerOnly ? "consumer" : rules.wholesale ? "wholesale" : ""} className={fieldCls}>
              <option value="">Cualquiera</option>
              <option value="consumer">Solo boleta (consumidor final)</option>
              <option value="wholesale">Solo factura (mayoristas)</option>
            </Select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Check name="firstPurchase" label="Solo primera compra" checked={rules.firstPurchase} />
          <Check name="newsletter" label="Solo suscritos a novedades" checked={rules.newsletter} />
          <Check name="excludeCombos" label="No aplica a combos" checked={rules.excludeCombos} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <fieldset>
            <legend className={labelCls}>Método de pago</legend>
            <div className="flex flex-wrap gap-2">
              <Check name="paymentMethods" value="card" label="Tarjeta" checked={rules.paymentMethods?.includes("card")} />
              <Check name="paymentMethods" value="wallet" label="Yape" checked={rules.paymentMethods?.includes("wallet")} />
            </div>
          </fieldset>
          <fieldset>
            <legend className={labelCls}>Zona de envío</legend>
            <div className="flex flex-wrap gap-2">
              <Check name="zones" value="lima" label="Lima y Callao" checked={rules.zones?.includes("lima")} />
              <Check name="zones" value="provinces" label="Provincias" checked={rules.zones?.includes("provinces")} />
            </div>
          </fieldset>
          <fieldset>
            <legend className={labelCls}>Solo estas ediciones</legend>
            <div className="flex flex-wrap gap-2">
              {editions.map((e) => (
                <Check key={e.id} name="editions" value={e.id} label={e.name} checked={rules.editions?.includes(e.id)} />
              ))}
            </div>
          </fieldset>
        </div>
        <p className="mt-2 text-xs text-adm-muted">Si no marcas nada en un grupo, vale para todos.</p>

        <label className="mt-4 block">
          <span className={labelCls}>Solo para estos correos (uno por línea, opcional)</span>
          <textarea name="customers" rows={2} defaultValue={rules.customers?.emails?.join("\n")} className={fieldCls} />
        </label>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-bold">Reglas avanzadas (JSON)</summary>
          <p className="mt-2 text-xs text-adm-muted">
            Para reglas sin campo propio: días de la semana (<code>daysOfWeek</code>), horario (<code>hours</code>), productos (<code>products</code>), departamentos, idiomas, etc.
          </p>
          <textarea
            name="advanced"
            rows={5}
            defaultValue={
              Object.keys({ ...advanced, ...customersExtra }).length
                ? JSON.stringify({ ...advanced, ...customersExtra }, null, 2)
                : ""
            }
            placeholder='{ "daysOfWeek": [5, 6], "hours": { "from": "18:00", "to": "23:59" } }'
            className={`${fieldCls} mt-2 tabular-nums tracking-wide text-xs`}
          />
        </details>
      </section>

      <label className="block">
        <span className={labelCls}>Nota interna (no se muestra)</span>
        <input name="note" defaultValue={coupon?.note} maxLength={300} className={fieldCls} />
      </label>
    </ActionForm>
  );
}
