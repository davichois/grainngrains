import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { translationConfig } from "@/src/lib/admin/texts";
import { productsView, sizesView } from "@/src/lib/admin/queries";
import { comboCoffees, localeOptions } from "@/src/lib/admin/combo-coffees";
import { dbReady } from "@/src/lib/db/supabase";
import { DbNotice, PageHeader } from "@/src/components/admin/ui";
import ComboForm from "@/src/components/admin/ComboForm";

export const metadata: Metadata = { title: "Nuevo combo" };

export default async function NewComboPage() {
  await requireAdmin();
  const [editions, sizes] = await Promise.all([productsView(), sizesView()]);
  return (
    <>
      {!dbReady() && <DbNotice />}
      <Link href="/admin/combos" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Combos
      </Link>
      <PageHeader kicker="Catálogo" title="Nuevo combo" description="Elige los cafés, su presentación y el descuento; el precio se calcula solo." />
      <ComboForm coffees={comboCoffees(editions)} sizes={sizes.map((s) => ({ id: s.id, label: s.label }))} locales={localeOptions()} translation={await translationConfig()} />
    </>
  );
}
