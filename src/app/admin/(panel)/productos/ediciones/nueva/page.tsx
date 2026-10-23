import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { dbReady } from "@/src/lib/db/supabase";
import { DbNotice, PageHeader } from "@/src/components/admin/ui";
import EditionForm from "@/src/components/admin/EditionForm";

export const metadata: Metadata = { title: "Nueva edición" };

export default async function NewEditionPage() {
  await requireAdmin();
  return (
    <>
      {!dbReady() && <DbNotice />}
      <Link href="/admin/productos" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Productos
      </Link>
      <PageHeader kicker="Catálogo" title="Nueva edición" description="Después de crearla, agrégale cafés: una edición sin cafés no aparece en la web." />
      <EditionForm />
    </>
  );
}
