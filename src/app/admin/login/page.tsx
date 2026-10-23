import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authConfigured, currentSession } from "@/src/lib/admin/auth";
import grainngrains from "@/public/grainngrains.svg";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await currentSession()) redirect("/admin");
  const { next } = await searchParams;

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center px-5 py-12 sm:px-10">
      <Image src={grainngrains} alt="Grain & Grains" priority className="mb-8 h-14 w-auto sm:h-16" />

      <div className="soft-in relative w-full max-w-sm border border-adm-line2 bg-adm-surface p-7 sm:p-9">
        <h1 className="sr-only">Entrar al panel</h1>

        {!authConfigured() && (
          <p className="mb-6 border-l-2 border-[#0FC0FC] bg-adm-cyan-tint px-4 py-3 text-xs leading-relaxed text-adm-sub">
            Falta configurar el acceso en el <code>.env</code>:{" "}
            <code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD_HASH</code> (con{" "}
            <code>npm run admin:password</code>) y{" "}
            <code>ADMIN_SESSION_SECRET</code>.
          </p>
        )}

        <LoginForm next={next} />
      </div>

      <Link href="/es" className="mt-6 text-[0.6875rem] text-adm-soft underline underline-offset-2 transition-colors hover:text-adm-ink">
        Ir a la web principal
      </Link>
    </main>
  );
}
