import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { couponView, formulaCatalog, productsView, sizesView } from "@/src/lib/admin/queries";
import { couponToFormula } from "@/src/lib/coupons/formula";
import { dbReady } from "@/src/lib/db/supabase";
import { Card, DbNotice, PageHeader } from "@/src/components/admin/ui";
import CouponForm from "@/src/components/admin/CouponForm";
import CouponFormula from "@/src/components/admin/CouponFormula";
import CouponTabs from "@/src/components/admin/CouponTabs";

export const metadata: Metadata = { title: "Nuevo cupón" };

const START = 'CUPON("NUEVO10",\n    PORCENTAJE(10)\n)';

export default async function NewCouponPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string }>;
}) {
  await requireAdmin();
  const [{ desde }, editions, sizes, catalog] = await Promise.all([
    searchParams,
    productsView(),
    sizesView(),
    formulaCatalog(),
  ]);
  /* "Duplicar": la fórmula del cupón original con otro código */
  const source = desde ? await couponView(desde) : null;
  const initial = source
    ? couponToFormula({ ...source.coupon, code: `${source.code}-COPIA`.slice(0, 40) }, catalog)
    : START;

  return (
    <>
      {!dbReady() && <DbNotice />}
      <Link href="/admin/cupones" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Cupones
      </Link>
      <PageHeader
        kicker="Promociones"
        title={source ? `Duplicar ${source.code}` : "Nuevo cupón"}
        description="Escríbelo como fórmula, al estilo de Power BI, o con el formulario. Se valida antes de guardar y funciona en la web apenas lo creas."
      />
      <CouponTabs
        formula={<CouponFormula catalog={catalog} initial={initial} canSave={dbReady()} />}
        form={
          <Card>
            <CouponForm
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
