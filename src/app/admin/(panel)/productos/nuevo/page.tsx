import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { coffeeOptionsView, productsView, sizesView } from "@/src/lib/admin/queries";
import { dbReady } from "@/src/lib/db/supabase";
import { DbNotice, PageHeader } from "@/src/components/admin/ui";
import ProductForm from "@/src/components/admin/ProductForm";

export const metadata: Metadata = { title: "Nuevo café" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ edicion?: string }>;
}) {
  await requireAdmin();
  const [{ edicion }, editions, sizes, varietals, processes] = await Promise.all([
    searchParams,
    productsView(),
    sizesView(),
    coffeeOptionsView("varietals"),
    coffeeOptionsView("processes"),
  ]);

  return (
    <>
      {!dbReady() && <DbNotice />}
      <Link href="/admin/productos" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Productos
      </Link>
      <PageHeader kicker="Catálogo" title="Nuevo café" description="Aparece en la web apenas lo guardas (si está a la venta)." />
      <ProductForm editions={editions} sizes={sizes} defaultEdition={edicion} options={{ varietals, processes }} />
    </>
  );
}
