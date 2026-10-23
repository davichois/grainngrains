"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { Loader2 } from "lucide-react";

/* ───────────────────────────────────────────────────────────────
   Filtros de las listas: se aplican al momento. Al escribir espera un
   instante (para no buscar en cada letra) y al cambiar un combo o una
   fecha filtra enseguida. La búsqueda queda en la URL (?q=…).
─────────────────────────────────────────────────────────────── */

const TYPING_MS = 250;

export default function FilterForm({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pending, start] = useTransition();

  const apply = () => {
    clearTimeout(timer.current);
    if (!form.current) return;
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(form.current)) {
      const s = String(v).trim();
      if (s) params.set(k, s);
    }
    const qs = params.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  /* Combos y fechas filtran al cambiar (escucha nativa: el combo avisa
     desde su input oculto, que React no reporta como onChange) */
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });
  useEffect(() => {
    const el = form.current;
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.type !== "text" && t.type !== "search") applyRef.current();
    };
    el?.addEventListener("change", onChange);
    return () => {
      el?.removeEventListener("change", onChange);
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <form
      ref={form}
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      onInput={(e) => {
        const t = e.target as unknown as HTMLInputElement;
        if (t.type === "text" || t.type === "search") {
          clearTimeout(timer.current);
          timer.current = setTimeout(apply, TYPING_MS);
        }
      }}
    >
      {children}
      <Loader2
        size={14}
        aria-hidden
        className={`pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 animate-spin text-adm-faint transition-opacity lg:block ${
          pending ? "opacity-100" : "opacity-0"
        }`}
      />
    </form>
  );
}
