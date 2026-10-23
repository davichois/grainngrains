import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { dbReady } from "@/src/lib/db/supabase";
import { DbNotice, PageHeader } from "@/src/components/admin/ui";
import OptionForm from "@/src/components/admin/OptionForm";

export const metadata: Metadata = { title: "Nueva varietal o proceso" };

export default async function NewOptionPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  await requireAdmin();
  const kind = (await searchParams).tipo === "procesos" ? "processes" : "varietals";
  return (
    <>
      {!dbReady() && <DbNotice />}
      <Link href={`/admin/opciones${kind === "processes" ? "?tipo=procesos" : ""}`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Varietales y procesos
      </Link>
      <PageHeader
        kicker="Catálogo"
        title={kind === "varietals" ? "Nueva varietal" : "Nuevo proceso"}
        description="Después de crearla, márcala en los cafés que la tienen (Productos → Editar)."
      />
      <OptionForm kind={kind} />
    </>
  );
}
