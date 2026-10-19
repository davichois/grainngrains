/* ───────────────────────────────────────────────────────────────
   PALABRAS CLAVE para crear cupones. Cada caso de uso es una sola
   palabra; un cupón se arma juntándolas:

     cupon("CODIGO", <un premio>, <reglas…>, <opciones…>)

   Ejemplo:
     cupon("MUJERES3X2", llevaPaga(3, 2), ediciones("mujeres"))

   La lista completa, con ejemplos, está en data.ts.
─────────────────────────────────────────────────────────────── */
import {
  CATEGORIES,
  COMBOS,
  findProduct,
} from "@/src/components/product-showcase/data";
import {
  GRINDS,
  type GrindId,
  type ShippingZone,
  type SizeId,
} from "@/src/lib/shop";
import type {
  Coupon,
  CouponReward,
  CouponRules,
  CustomerList,
  GiftReward,
  PaymentKind,
} from "./index";

/** Pieza de un cupón: un premio, reglas u opciones */
type Part =
  | { kind: "reward"; reward: CouponReward }
  | { kind: "rules"; rules: CouponRules }
  | {
      kind: "options";
      options: Pick<
        Coupon,
        "active" | "autoApply" | "stackable" | "exclusive" | "aliases" | "note"
      >;
    };

const premio = (reward: CouponReward): Part => ({ kind: "reward", reward });
const regla = (rules: CouponRules): Part => ({ kind: "rules", rules });
const opcion = (
  options: Extract<Part, { kind: "options" }>["options"],
): Part => ({
  kind: "options",
  options,
});

/* ── Nombres en español → ids internos ── */
const EDICIONES: Record<string, string> = {
  caficultores: "farmers",
  mujeres: "women",
  clasicos: "classic",
  clásicos: "classic",
  infusionados: "infused",
};
const edicion = (e: string) => EDICIONES[e.toLowerCase()] ?? e;

const DIAS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
};

const MOLIENDAS: Record<string, GrindId> = {
  "grano entero": "wholeBean",
  grano: "wholeBean",
  grueso: "coarse",
  medio: "medium",
  fino: "fine",
};

/* ══════════════ PREMIOS (uno por cupón) ══════════════ */

/** 10% de descuento · porcentaje(15, { tope: 40 }) → máximo S/ 40 */
export const porcentaje = (valor: number, o: { tope?: number } = {}) =>
  premio({ type: "percent", value: valor, maxDiscount: o.tope });

/** S/ 20 de descuento */
export const montoFijo = (soles: number) =>
  premio({ type: "fixed", value: soles });

/** La bolsa más barata gratis */
export const gratisElMasBarato = premio({
  type: "percentItem",
  value: 100,
  target: "cheapest",
});

/** % sobre la bolsa más barata o la más cara */
export const descuentoEnUno = (
  valor: number,
  cual: "mas barato" | "mas caro" = "mas barato",
) =>
  premio({
    type: "percentItem",
    value: valor,
    target: cual === "mas caro" ? "mostExpensive" : "cheapest",
  });

/** Precio especial por bolsa (p. ej. 1 kg a S/ 200) */
export const precioEspecial = (soles: number) =>
  premio({ type: "fixedPrice", price: soles });

/** Lleva 3, paga 2 */
export const llevaPaga = (lleva: number, paga: number) =>
  premio({ type: "buyXgetY", buy: paga, get: lleva - paga });

/** La 2.ª bolsa con 50% de descuento */
export const segundoAl = (porciento: number) =>
  premio({ type: "buyXgetY", buy: 1, get: 1, discount: porciento });

/** Producto de regalo: regalo("classic", "morningClassic", "250g", "grano entero") */
export const regalo = (
  edicionId: string,
  productoId: string,
  presentacion: SizeId = "250g",
  molienda: string = "grano entero",
  cantidad = 1,
) =>
  premio({
    type: "gift",
    categoryId: edicion(edicionId),
    productId: productoId,
    size: presentacion,
    grind: MOLIENDAS[molienda.toLowerCase()] ?? (molienda as GrindId),
    qty: cantidad,
  } satisfies GiftReward);

/** S/ 10 por cada S/ 100 de compra */
export const montoPorCada = (soles: number, cada: number) =>
  premio({ type: "fixedPer", value: soles, every: cada });

/** Envío gratis */
export const envioGratis = premio({ type: "freeShipping" });

/** S/ 5 menos en el envío */
export const descuentoEnvio = (soles: number) =>
  premio({ type: "shippingDiscount", value: soles });

/** 50% de descuento en el envío */
export const descuentoEnvioPorcentaje = (porciento: number) =>
  premio({ type: "shippingPercent", value: porciento });

/** El envío cuesta S/ 5 (o menos, si ya era menor) */
export const envioA = (soles: number) =>
  premio({ type: "shippingFixed", price: soles });

/** % según cantidad de cafés: escalasPorCantidad({ 10: 15, 20: 20 }) */
export const escalasPorCantidad = (escalas: Record<number, number>) =>
  premio({
    type: "tiered",
    by: "qty",
    tiers: Object.entries(escalas).map(([min, percent]) => ({
      min: Number(min),
      percent,
    })),
  });

/** % según monto en soles: escalasPorMonto({ 200: 5, 400: 10 }) */
export const escalasPorMonto = (escalas: Record<number, number>) =>
  premio({
    type: "tiered",
    by: "amount",
    tiers: Object.entries(escalas).map(([min, percent]) => ({
      min: Number(min),
      percent,
    })),
  });

/* ══════════════ REGLAS (las que quieras) ══════════════ */

/* Carrito */
export const compraMinima = (soles: number) => regla({ minSubtotal: soles });
export const compraMaxima = (soles: number) => regla({ maxSubtotal: soles });
export const cantidadMinima = (cafes: number) => regla({ minQty: cafes });
export const cantidadMaxima = (cafes: number) => regla({ maxQty: cafes });
/** Estos productos deben estar en el carrito */
export const requiere = (...productos: string[]) =>
  regla({ requireProducts: productos });
/** Al menos N bolsas de un producto: requiereCantidad("donEliseoFarm", 2) */
export const requiereCantidad = (producto: string, cantidad: number) =>
  regla({ requireQty: { [producto]: cantidad } });
/** Al menos N productos distintos (variedad) */
export const variedadMinima = (n: number) => regla({ minDistinct: n });

/* Qué productos reciben el descuento */
/** ediciones("caficultores", "mujeres", "clasicos", "infusionados") */
export const ediciones = (...e: string[]) =>
  regla({ editions: e.map(edicion) });
export const exceptoEdiciones = (...e: string[]) =>
  regla({ excludeEditions: e.map(edicion) });
export const productos = (...p: string[]) => regla({ products: p });
export const exceptoProductos = (...p: string[]) =>
  regla({ excludeProducts: p });
/** presentacion("1kg") · presentacion("250g") */
export const presentacion = (...s: SizeId[]) => regla({ sizes: s });
/** moliendas("grano entero", "fino") */
export const moliendas = (...m: string[]) =>
  regla({
    grinds: m.map((x) => MOLIENDAS[x.toLowerCase()] ?? (x as GrindId)),
  });
/** El descuento alcanza como máximo a N bolsas (las más caras) */
export const limiteUnidades = (n: number) => regla({ maxDiscountedUnits: n });
/** Tope del descuento en soles, para cualquier premio */
export const topeDescuento = (soles: number) => regla({ maxDiscount: soles });
export const sinCombos = regla({ excludeCombos: true });
export const soloCombos = regla({ onlyCombos: true });

/* Cliente */
/** Solo con Factura (RUC) */
export const mayorista = regla({ wholesale: true });
export const correos = (...emails: string[]) =>
  regla({ customers: { emails } });
/** dominios("miempresa.com") → todos los correos @miempresa.com */
export const dominios = (...domains: string[]) =>
  regla({ customers: { domains } });
/** DNI o RUC autorizados */
export const documentos = (...documents: string[]) =>
  regla({ customers: { documents } });
/** Solo si marca "Quiero recibir novedades" */
export const suscriptores = regla({ newsletter: true });
/** Solo con Boleta (consumidor final, no empresas) */
export const soloBoleta = regla({ consumerOnly: true });
/** Clientes que NO pueden usarlo */
export const exceptoCorreos = (...emails: string[]) =>
  regla({ excludeCustomers: { emails } });
export const exceptoDominios = (...domains: string[]) =>
  regla({ excludeCustomers: { domains } });
export const exceptoDocumentos = (...documents: string[]) =>
  regla({ excludeCustomers: { documents } });
/** Solo para quien compra con la web en estos idiomas: idiomas("en", "de") */
export const idiomas = (...l: string[]) => regla({ locales: l });

/* Pago y envío */
export const soloYape = regla({ paymentMethods: ["wallet"] as PaymentKind[] });
export const soloTarjeta = regla({ paymentMethods: ["card"] as PaymentKind[] });
export const soloLima = regla({ zones: ["lima"] as ShippingZone[] });
export const soloProvincias = regla({ zones: ["provinces"] as ShippingZone[] });
/** departamentos("Arequipa", "Cusco") */
export const departamentos = (...d: string[]) => regla({ departments: d });
export const exceptoDepartamentos = (...d: string[]) =>
  regla({ excludeDepartments: d });

/* Fechas y horarios (hora de Lima) */
export const desde = (fecha: string) => regla({ validFrom: fecha });
export const hasta = (fecha: string) => regla({ validUntil: fecha });
/** vigencia("2026-12-01", "2026-12-31") · también con hora:
    vigencia("2026-11-27 00:00", "2026-11-27 23:59") */
export const vigencia = (inicio: string, fin: string) =>
  regla({ validFrom: inicio, validUntil: fin });
/** dias("viernes", "sabado", "domingo") */
export const dias = (...d: string[]) =>
  regla({ daysOfWeek: d.map((x) => DIAS[x.toLowerCase()] ?? -1) });
export const finDeSemana = dias("sabado", "domingo");
/** Fechas sueltas: fechas("2026-07-28", "2026-07-29") */
export const fechas = (...f: string[]) => regla({ dates: f });
/** Días del mes: diasDelMes(1, 15) · -1 = último día del mes */
export const diasDelMes = (...d: number[]) => regla({ monthDays: d });
/** Días de pago: 15 y último día del mes */
export const quincena = diasDelMes(15, -1);
export const finDeMes = diasDelMes(-1);
/** horario("06:00", "10:00") · puede cruzar la medianoche: horario("22:00", "02:00") */
export const horario = (de: string, a: string) =>
  regla({ hours: { from: de, to: a } });

/* Límites de uso (necesitan Upstash Redis) */
export const usosMaximos = (n: number) => regla({ maxUses: n });
export const usosPorCliente = (n: number) => regla({ maxUsesPerCustomer: n });
export const unaVezPorCliente = usosPorCliente(1);
export const primeraCompra = regla({ firstPurchase: true });
/** Clientes con al menos N compras pagadas antes */
export const clienteFrecuente = (compras: number) =>
  regla({ minPreviousOrders: compras });
/** Usos máximos por día (se reinicia a medianoche, hora de Lima) */
export const usosPorDia = (n: number) => regla({ maxUsesPerDay: n });
/** Soles de descuento totales que se pueden regalar con el cupón */
export const presupuesto = (soles: number) => regla({ budget: soles });

/* ══════════════ OPCIONES ══════════════ */

/** Se aplica solo, sin escribir el código */
export const automatico = opcion({ autoApply: true });
/** Se suma con otras promociones acumulables */
export const acumulable = opcion({ stackable: true });
/** Desactivado (no se puede usar) */
export const inactivo = opcion({ active: false });
/** No se combina con nada: o este cupón, o las demás promociones */
export const exclusivo = opcion({ exclusive: true });
/** Otros códigos para el mismo cupón: alias("ANA10", "LUIS10") */
export const alias = (...codigos: string[]) =>
  opcion({ aliases: codigos.map((c) => c.trim().toUpperCase()) });
/** Nota interna, no se muestra */
export const nota = (texto: string) => opcion({ note: texto });

/* ══════════════ ARMAR EL CUPÓN ══════════════ */

/* Productos y combos que existen (para detectar errores de escritura) */
const allProducts = new Set([
  ...CATEGORIES.flatMap((c) => c.products.map((p) => p.id)),
  ...COMBOS.map((c) => c.id),
]);
const allEditions = new Set(CATEGORIES.map((c) => c.id));
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FECHA = /^\d{4}-\d{2}-\d{2}( ([01]\d|2[0-3]):[0-5]\d)?$/;

/** Errores de escritura en un cupón (ediciones, productos, días, fechas…) */
function problemas(c: Coupon, rewards: number) {
  const out: string[] = [];
  if (rewards !== 1)
    out.push(`necesita exactamente un premio (tiene ${rewards})`);
  const r = c.rules ?? {};
  for (const e of [...(r.editions ?? []), ...(r.excludeEditions ?? [])])
    if (!allEditions.has(e)) out.push(`edición desconocida "${e}"`);
  for (const p of [
    ...(r.products ?? []),
    ...(r.excludeProducts ?? []),
    ...(r.requireProducts ?? []),
    ...Object.keys(r.requireQty ?? {}),
  ])
    if (!allProducts.has(p)) out.push(`producto desconocido "${p}"`);
  if (r.daysOfWeek?.includes(-1)) out.push("día de la semana mal escrito");
  if (r.hours && !(HORA.test(r.hours.from) && HORA.test(r.hours.to)))
    out.push('horario con formato distinto a "HH:MM"');
  for (const f of [r.validFrom, r.validUntil, ...(r.dates ?? [])])
    if (f && !FECHA.test(f))
      out.push(`fecha "${f}" no es AAAA-MM-DD (o AAAA-MM-DD HH:MM)`);
  if (r.dates?.some((d) => d.length > 10))
    out.push("fechas() va sin hora: usa vigencia() para fechas con hora");
  for (const d of r.monthDays ?? [])
    if (d !== -1 && (d < 1 || d > 31))
      out.push(`día del mes ${d} fuera de 1–31`);
  for (const g of r.grinds ?? [])
    if (!GRINDS.includes(g)) out.push(`molienda desconocida "${g}"`);
  if (r.wholesale && r.consumerOnly)
    out.push("mayorista y soloBoleta no pueden ir juntos");
  if (c.reward.type === "gift") {
    const g = c.reward;
    if (!findProduct(g.categoryId, g.productId))
      out.push(`regalo desconocido "${g.categoryId}/${g.productId}"`);
    if (!GRINDS.includes(g.grind))
      out.push(`molienda desconocida "${g.grind}"`);
  }
  return out;
}

const mergeList = (a: CustomerList = {}, b: CustomerList): CustomerList => ({
  emails: [...(a.emails ?? []), ...(b.emails ?? [])],
  domains: [...(a.domains ?? []), ...(b.domains ?? [])],
  documents: [...(a.documents ?? []), ...(b.documents ?? [])],
});

/**
 * Junta las palabras clave en un cupón. Si algo está mal escrito, el cupón
 * queda desactivado y se avisa en la consola (el checkout sigue funcionando).
 */
export function cupon(codigo: string, ...partes: Part[]): Coupon {
  const rewards = partes.filter((p) => p.kind === "reward");
  const rules: CouponRules = {};
  let options: Extract<Part, { kind: "options" }>["options"] = {};
  for (const p of partes) {
    if (p.kind === "rules") {
      /* Las listas de clientes y las cantidades requeridas se suman */
      const { customers, excludeCustomers, requireQty, ...rest } = p.rules;
      Object.assign(rules, rest);
      if (customers) rules.customers = mergeList(rules.customers, customers);
      if (excludeCustomers)
        rules.excludeCustomers = mergeList(
          rules.excludeCustomers,
          excludeCustomers,
        );
      if (requireQty) rules.requireQty = { ...rules.requireQty, ...requireQty };
    }
    if (p.kind === "options") options = { ...options, ...p.options };
  }
  const coupon: Coupon = {
    code: codigo.trim().toUpperCase(),
    reward: (rewards[0] as Extract<Part, { kind: "reward" }> | undefined)
      ?.reward ?? { type: "fixed", value: 0 },
    ...(Object.keys(rules).length > 0 && { rules }),
    ...options,
  };
  const errores = problemas(coupon, rewards.length);
  if (errores.length > 0) {
    console.error(
      `[cupones] ${coupon.code} desactivado: ${errores.join("; ")}`,
    );
    coupon.active = false;
  }
  return coupon;
}
