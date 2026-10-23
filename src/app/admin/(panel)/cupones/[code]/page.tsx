import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy, RotateCcw } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { couponView, formulaCatalog, productsView, sizesView } from "@/src/lib/admin/queries";
import { couponToFormula } from "@/src/lib/coupons/formula";
import { rewardText } from "@/src/lib/admin/coupon-format";
import { dbReady } from "@/src/lib/db/supabase";
import { Card, DbNotice, Stat, btnGhost, money } from "@/src/components/admin/ui";
import DeleteCouponButton from "@/src/components/admin/DeleteCouponButton";
import CouponForm from "@/src/components/admin/CouponForm";
import CouponFormula from "@/src/components/admin/CouponFormula";
import CouponTabs from "@/src/components/admin/CouponTabs";
import { restoreCoupon } from "../../actions/coupons";

export const metadata: Metadata = { title: "Cupón" };

export default async function CouponPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  await requireAdmin();
  const { code } = await params;
  /* Todo a la vez (el cupón y los datos del formulario) */
  const [c, editions, sizes, catalog] = await Promise.all([
    couponView(decodeURIComponent(code)),
    productsView(),
    sizesView(),
    formulaCatalog(),
  ]);
  if (!c) notFound();
  const ready = dbReady();

  return (
    <>
      {!ready && <DbNotice />}
      <Link href="/admin/cupones" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Cupones
      </Link>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.25em] text-adm-muted">
            {c.origin === "panel" ? "Creado en el panel" : c.origin === "both" ? "Del código · editado en el panel" : "Del código"}
          </p>
          <h1 className="mt-1 tabular-nums tracking-wide text-3xl font-bold">{c.code}</h1>
          <p className="mt-1 font-semibold">{rewardText(c.coupon)}</p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {c.origin === "both" && ready && (
            <form action={restoreCoupon.bind(null, c.code)}>
              <button className={btnGhost}><RotateCcw size={15} /> Volver al del código</button>
            </form>
          )}
          {c.hidden && ready && (
            <form action={restoreCoupon.bind(null, c.code)}>
              <button className={btnGhost}><RotateCcw size={15} /> Restaurar</button>
            </form>
          )}
          <Link href={`/admin/cupones/nuevo?desde=${encodeURIComponent(c.code)}`} className={btnGhost}><Copy size={14} /> Duplicar</Link>
          {!c.hidden && <DeleteCouponButton code={c.code} fromCode={c.origin !== "panel"} disabled={!ready} />}
        </div>
      </header>
      <div className="mb-8 grid grid-cols-2 gap-3">
        <Stat label="Usos (pedidos pagados)" value={c.uses} />
        <Stat label="Descuento regalado" value={money(c.discount)} />
      </div>
      <CouponTabs
        formula={<CouponFormula catalog={catalog} initial={couponToFormula(c.coupon, catalog)} original={c.code} canSave={ready} />}
        form={
          <Card>
            <CouponForm
              coupon={c.coupon}
              editions={editions.map((e) => ({ id: e.id, name: e.name }))}
              sizes={sizes.map((s) => ({ id: s.id, label: s.label }))}
              products={editions.flatMap((e) => e.products.map((p) => ({ value: `${e.id}/${p.id}`, label: `${p.name} · ${e.name}` })))}
            />
          </Card>
        }
      />
    </>
  );
}
