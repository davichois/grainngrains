"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/src/lib/admin/auth";
import { db, dbReady, SITE_DATA_TAG } from "@/src/lib/db/supabase";
import { logAudit } from "@/src/lib/admin/audit";
import { baseCoupons } from "@/src/lib/site-data/apply";
import { couponProblems } from "@/src/lib/coupons/keywords";
import type { Coupon, CouponReward, CouponRules } from "@/src/lib/coupons";
import { DEFAULT_SIZE, SIZES } from "@/src/lib/shop";
import { ensureSiteData } from "@/src/lib/site-data/load";
import { evaluateFormula } from "@/src/lib/coupons/formula";
import { formulaCatalog } from "@/src/lib/admin/queries";
import type { ActionState } from "./orders";

const str = (f: FormData, k: string, max = 200) =>
  String(f.get(k) ?? "").trim().slice(0, max);
const num = (f: FormData, k: string) => {
  const v = str(f, k).replace(",", ".");
  if (v === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`"${k}" debe ser un número válido.`);
  return n;
};
const need = (f: FormData, k: string, label: string) => {
  const n = num(f, k);
  if (n === undefined || n <= 0) throw new Error(`Falta ${label}.`);
  return n;
};
const list = (f: FormData, k: string) =>
  str(f, k, 4000)
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
/** "2026-12-31T23:59" → "2026-12-31 23:59" (hora de Lima) */
const date = (f: FormData, k: string) => str(f, k, 20).replace("T", " ") || undefined;

function parseReward(f: FormData): CouponReward {
  switch (str(f, "reward_type")) {
    case "percent": {
      const max = num(f, "r_max");
      return { type: "percent", value: need(f, "r_value", "el porcentaje"), ...(max && { maxDiscount: max }) };
    }
    case "fixed":
      return { type: "fixed", value: need(f, "r_value", "el monto") };
    case "fixedPer":
      return { type: "fixedPer", value: need(f, "r_value", "el monto"), every: need(f, "r_every", "cada cuánto") };
    case "percentItem":
      return {
        type: "percentItem",
        value: need(f, "r_value", "el porcentaje"),
        target: str(f, "r_target") === "mostExpensive" ? "mostExpensive" : "cheapest",
      };
    case "fixedPrice":
      return { type: "fixedPrice", price: need(f, "r_price", "el precio") };
    case "buyXgetY": {
      const discount = num(f, "r_discount");
      return {
        type: "buyXgetY",
        buy: need(f, "r_buy", "cuántas paga"),
        get: need(f, "r_get", "cuántas lleva con descuento"),
        ...(discount && discount < 100 && { discount }),
      };
    }
    case "gift": {
      const [categoryId, productId] = str(f, "r_gift").split("/");
      if (!categoryId || !productId) throw new Error("Elige el café de regalo.");
      return {
        type: "gift",
        categoryId,
        productId,
        size: SIZES.includes(str(f, "r_size")) ? str(f, "r_size") : DEFAULT_SIZE,
        grind: (str(f, "r_grind") || "wholeBean") as "wholeBean",
        qty: num(f, "r_qty") || 1,
      };
    }
    case "freeShipping":
      return { type: "freeShipping" };
    case "shippingDiscount":
      return { type: "shippingDiscount", value: need(f, "r_value", "el monto") };
    case "shippingPercent":
      return { type: "shippingPercent", value: need(f, "r_value", "el porcentaje") };
    case "shippingFixed":
      return { type: "shippingFixed", price: num(f, "r_price") ?? 0 };
    case "tiered": {
      const tiers = list(f, "r_tiers").map((line) => {
        const [min, percent] = line.split(":").map((x) => Number(x.trim()));
        if (!(min >= 0) || !(percent > 0)) throw new Error(`Escala mal escrita: "${line}" (usa mínimo:porcentaje).`);
        return { min, percent };
      });
      if (!tiers.length) throw new Error("Agrega al menos una escala.");
      return { type: "tiered", by: str(f, "r_by") === "amount" ? "amount" : "qty", tiers };
    }
    default:
      throw new Error("Elige el tipo de premio.");
  }
}

function parseRules(f: FormData): CouponRules {
  const r: CouponRules = {};
  const set = <K extends keyof CouponRules>(k: K, v: CouponRules[K] | undefined) => {
    if (v !== undefined && !(Array.isArray(v) && v.length === 0)) r[k] = v;
  };
  set("minSubtotal", num(f, "minSubtotal"));
  set("maxSubtotal", num(f, "maxSubtotal"));
  set("minQty", num(f, "minQty"));
  set("validFrom", date(f, "validFrom"));
  set("validUntil", date(f, "validUntil"));
  set("maxUses", num(f, "maxUses"));
  set("maxUsesPerCustomer", num(f, "maxUsesPerCustomer"));
  set("maxUsesPerDay", num(f, "maxUsesPerDay"));
  set("budget", num(f, "budget"));
  set("maxDiscount", num(f, "maxDiscount"));
  if (f.get("firstPurchase") === "on") r.firstPurchase = true;
  if (f.get("newsletter") === "on") r.newsletter = true;
  if (f.get("excludeCombos") === "on") r.excludeCombos = true;
  const buyer = str(f, "buyer");
  if (buyer === "consumer") r.consumerOnly = true;
  if (buyer === "wholesale") r.wholesale = true;
  set("paymentMethods", f.getAll("paymentMethods").map(String) as CouponRules["paymentMethods"]);
  set("zones", f.getAll("zones").map(String) as CouponRules["zones"]);
  set("editions", f.getAll("editions").map(String));
  const emails = list(f, "customers");
  if (emails.length) r.customers = { emails: emails.map((e) => e.toLowerCase()) };

  const adv = str(f, "advanced", 8000);
  if (adv) {
    let extra: unknown;
    try {
      extra = JSON.parse(adv);
    } catch {
      throw new Error("Las reglas avanzadas no son un JSON válido.");
    }
    if (!extra || typeof extra !== "object" || Array.isArray(extra))
      throw new Error("Las reglas avanzadas deben ser un objeto JSON { … }.");
    const { customers, ...rest } = extra as CouponRules;
    Object.assign(r, rest);
    /* Correos del campo propio + dominios/documentos de las avanzadas */
    if (customers) r.customers = { ...customers, ...(r.customers ?? {}) };
  }
  return r;
}

export async function saveCoupon(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return { error: "Conecta Supabase para guardar cupones." };
  await ensureSiteData(); // presentaciones y catálogo actuales para validar
  let coupon: Coupon;
  const editing = str(form, "original");
  try {
    const code = (editing || str(form, "code", 40)).toUpperCase();
    if (!/^[A-Z0-9_-]{3,40}$/.test(code))
      return { error: "El código debe tener de 3 a 40 letras, números, - o _." };
    const rules = parseRules(form);
    coupon = {
      code,
      reward: parseReward(form),
      ...(Object.keys(rules).length && { rules }),
      active: form.get("active") === "on",
      ...(form.get("autoApply") === "on" && { autoApply: true }),
      ...(form.get("stackable") === "on" && { stackable: true }),
      ...(form.get("exclusive") === "on" && { exclusive: true }),
      ...(list(form, "aliases").length && {
        aliases: list(form, "aliases").map((a) => a.toUpperCase()),
      }),
      ...(str(form, "note", 300) && { note: str(form, "note", 300) }),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Revisa los datos del cupón." };
  }

  return persistCoupon(coupon, editing);
}

/** Valida y guarda un cupón ya armado (desde el formulario o la fórmula) */
async function persistCoupon(coupon: Coupon, editing: string): Promise<ActionState> {
  const problems = couponProblems(coupon);
  if (problems.length) return { error: `No se guardó: ${problems.join("; ")}.` };

  try {
    if (!editing) {
      const exists =
        baseCoupons().some((c) => c.code === coupon.code) ||
        (await db.one("coupons", { code: `eq.${coupon.code}`, deleted: "eq.false" }));
      if (exists) return { error: `Ya existe un cupón ${coupon.code}.` };
    }
    await db.upsert("coupons", {
      code: coupon.code,
      data: coupon,
      deleted: false,
      updated_at: new Date().toISOString(),
    });
    await logAudit(editing ? "Editó un cupón" : "Creó un cupón", "cupón", coupon.code, { premio: coupon.reward });
    updateTag(SITE_DATA_TAG);
    revalidatePath("/admin/cupones");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
  if (!editing) redirect(`/admin/cupones/${coupon.code}`);
  revalidatePath(`/admin/cupones/${coupon.code}`);
  return { ok: "Cupón guardado. Ya funciona en la web." };
}

/** Crea o guarda un cupón escrito como fórmula (estilo Power BI) */
export async function saveCouponFormula(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return { error: "Conecta Supabase para guardar cupones." };
  await ensureSiteData();
  const editing = str(form, "original").toUpperCase();
  const { coupon, errors } = evaluateFormula(str(form, "formula", 20000), await formulaCatalog());
  if (!coupon) return { error: errors.map((e) => e.message).join(" · ") || "Revisa la fórmula." };
  if (editing && coupon.code !== editing)
    return { error: `El código no se puede cambiar (es ${editing}). Para otro código, usa "Duplicar".` };
  return persistCoupon(coupon, editing);
}

/** Pausar o reactivar (desde la lista) */
export async function toggleCoupon(code: string, active: boolean, current: Coupon) {
  await requireAdmin();
  if (!dbReady()) return;
  await db.upsert("coupons", {
    code,
    data: { ...current, active },
    deleted: false,
    updated_at: new Date().toISOString(),
  });
  await logAudit(active ? "Reactivó un cupón" : "Pausó un cupón", "cupón", code);
  updateTag(SITE_DATA_TAG);
  revalidatePath("/admin/cupones");
}

/** Borra un cupón del panel u oculta uno del código */
export async function deleteCoupon(code: string): Promise<ActionState> {
  await requireAdmin();
  if (!dbReady()) return { error: "Conecta Supabase para guardar cupones." };
  const fromCode = baseCoupons().find((c) => c.code === code);
  if (fromCode)
    await db.upsert("coupons", { code, data: fromCode, deleted: true, updated_at: new Date().toISOString() });
  else await db.remove("coupons", { code: `eq.${code}` });
  await logAudit("Eliminó un cupón", "cupón", code);
  updateTag(SITE_DATA_TAG);
  revalidatePath("/admin/cupones");
  redirect("/admin/cupones");
}

/** Vuelve a la versión del código (deshace cambios del panel) */
export async function restoreCoupon(code: string) {
  await requireAdmin();
  if (!dbReady()) return;
  await db.remove("coupons", { code: `eq.${code}` });
  await logAudit("Restauró un cupón del código", "cupón", code);
  updateTag(SITE_DATA_TAG);
  revalidatePath("/admin/cupones");
  revalidatePath(`/admin/cupones/${code}`);
}
