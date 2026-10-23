"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Boxes,
  Coffee,
  History,
  Inbox,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  TicketPercent,
  X,
} from "lucide-react";
import grainngrains from "@/public/grainngrains.svg";
import { logoutAction } from "@/src/app/admin/(panel)/actions/session";
import type { AdminTheme } from "@/src/lib/admin/theme";
import ThemeSwitch from "./ThemeSwitch";
import AdminSkeleton from "./AdminSkeleton";

const NAV = [
  { href: "/admin", label: "Resumen", hint: "Ventas y pendientes del día", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos y stock", hint: "Precios, stock y nombres", icon: Coffee },
  { href: "/admin/opciones", label: "Varietales y procesos", hint: "Lo que el cliente elige de cada café", icon: Leaf },
  { href: "/admin/cupones", label: "Cupones", hint: "Descuentos y regalos", icon: TicketPercent },
  { href: "/admin/combos", label: "Combos", hint: "Packs de cafés con descuento", icon: Boxes },
  { href: "/admin/pedidos", label: "Pedidos", hint: "Pagos y envíos", icon: ShoppingBag, badge: "orders" },
  { href: "/admin/mensajes", label: "Mensajes", hint: "Contacto y cotizaciones", icon: Inbox, badge: "messages" },
  { href: "/admin/ajustes", label: "Ajustes", hint: "Contacto, envíos y promoción", icon: Settings },
  { href: "/admin/actividad", label: "Actividad", hint: "Historial de cambios", icon: History },
] as const;

/* Las de uso diario van en la barra de arriba (computadora); el resto, en el menú ☰ */
const TOP = new Set<string>(["/admin", "/admin/productos", "/admin/pedidos", "/admin/mensajes", "/admin/cupones"]);

/* Mismo margen a los costados en la barra y en el contenido */
const gutter = "mx-auto w-full max-w-6xl px-5 sm:px-10 lg:px-16";

export default function AdminShell({
  user,
  badges,
  theme,
  children,
}: {
  user: string;
  badges: { orders: number; messages: number };
  theme: AdminTheme;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [open, setOpen] = useState(false);
  /* Página a la que se está yendo: mientras llega, barra arriba y esqueleto */
  const [going, setGoing] = useState<string | null>(null);

  /* Al tocar un enlace del panel se muestra al instante que se está
     cambiando de página (sin esperar al servidor) */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !url.pathname.startsWith("/admin")) return;
      if (url.pathname.includes("/exportar")) return;
      if (url.pathname + url.search === location.pathname + location.search) return;
      setGoing(url.pathname + url.search);
    };
    /* En captura: los enlaces de Next cancelan el clic para navegar ellos */
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  /* Llegó la página (o se canceló): se quita el aviso */
  useEffect(() => {
    const id = setTimeout(() => setGoing(null), 0);
    return () => clearTimeout(id);
  }, [pathname, search]);
  useEffect(() => {
    if (!going) return;
    const id = setTimeout(() => setGoing(null), 10000);
    return () => clearTimeout(id);
  }, [going]);
  /* El esqueleto solo si cambia de página (no al filtrar la misma) */
  const leaving = going !== null && going.split("?")[0] !== pathname;

  /* Al cambiar de página se cierra el menú */
  useEffect(() => {
    const id = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(id);
  }, [pathname]);

  /* Con el menú abierto: sin desplazar la página de atrás y Esc lo cierra */
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);


  return (
    <div className="min-h-svh">
      {/* En computadora: todas las secciones en una barra arriba */}
      <header className="sticky top-0 z-40 hidden border-b-2 border-[#D4FF47] bg-adm-solid lg:block">
        <div className="flex h-16 items-center gap-8 px-8 xl:px-12">
          <Link href="/admin" aria-label="Resumen" className="shrink-0">
            <Image src={grainngrains} alt="Grain & Grains" className="h-7 w-auto brightness-0 invert" />
          </Link>
          <nav aria-label="Secciones del panel" className="flex min-w-0 flex-1 items-stretch justify-center gap-1 self-stretch">
            {NAV.filter((item) => TOP.has(item.href)).map((item) => {
              const on = active(item.href);
              const count = "badge" in item ? badges[item.badge] : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.hint}
                  aria-current={on ? "page" : undefined}
                  className={`relative flex items-center gap-1.5 whitespace-nowrap px-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] transition-colors xl:px-3 ${
                    on ? "text-white" : "text-white/55 hover:text-white"
                  }`}
                >
                  {item.label}
                  {count > 0 && (
                    <span className="bg-[#D4FF47] px-1.5 py-px text-[0.5625rem] font-bold tabular-nums tracking-normal text-[#1E1E1E]">{count}</span>
                  )}
                  <span className={`absolute inset-x-2.5 bottom-0 h-0.5 bg-[#0FC0FC] transition-opacity ${on ? "opacity-100" : "opacity-0"}`} />
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Más secciones, tema y cerrar sesión"
            aria-expanded={open}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-white/70 transition-colors hover:bg-[#0FC0FC] hover:text-[#1E1E1E]"
          >
            <Menu size={20} strokeWidth={1.6} />
          </button>
        </div>
      </header>

      {/* Botón del menú, fijo arriba a la derecha (punto lima = pendientes) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú del panel"
        aria-expanded={open}
        className="fixed right-4 top-4 z-40 flex h-11 w-11 lg:hidden cursor-pointer items-center justify-center bg-adm-solid text-white transition-colors hover:bg-[#0FC0FC] hover:text-[#1E1E1E] sm:right-6 sm:top-6"
      >
        <Menu size={20} strokeWidth={1.6} />
        {badges.orders + badges.messages > 0 && (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-adm-surface bg-[#D4FF47]" />
        )}
      </button>

      {/* Menú a pantalla completa (se abre tocando el logo) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú del panel"
        aria-hidden={!open}
        className={`fixed inset-0 z-50 flex flex-col bg-adm-surface transition-opacity duration-300 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {/* Franja gris con el logo */}
        <div className="shrink-0 border-b-4 border-[#D4FF47] bg-adm-solid">
          <div className="flex h-24 items-center justify-between gap-4 px-8 sm:h-32 sm:px-16">
            <div className="flex min-w-0 items-center gap-5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                tabIndex={open ? 0 : -1}
                className="shrink-0 cursor-pointer"
              >
                <Image
                  src={grainngrains}
                  alt="Grain & Grains"
                  className="h-7 w-auto brightness-0 invert sm:h-8"
                />
              </button>
              <span className="hidden truncate text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-white/75 sm:block">
                Panel de administración
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              tabIndex={open ? 0 : -1}
              className="cursor-pointer p-1 text-white/75 transition-colors hover:text-white"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Secciones */}
        <nav className="min-h-0 flex-1 overflow-y-auto">
          <ul className="mx-auto w-full max-w-2xl divide-y divide-adm-line border-b border-adm-line">
            {NAV.map((item) => {
              const Icon = item.icon;
              const on = active(item.href);
              const count = "badge" in item ? badges[item.badge] : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={on ? "page" : undefined}
                    tabIndex={open ? 0 : -1}
                    onClick={() => setOpen(false)}
                    className={`group flex items-start gap-4 px-5 py-4 transition-colors sm:px-7 sm:py-5 ${
                      on ? "bg-adm-cyan-tint" : "hover:bg-adm-subtle"
                    }`}
                  >
                    <Icon
                      size={19}
                      strokeWidth={1.4}
                      className={`mt-0.5 shrink-0 transition-colors ${
                        on ? "text-adm-cyan-ink" : "text-adm-soft group-hover:text-adm-cyan-ink"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.9375rem] font-semibold leading-snug text-adm-ink">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-adm-muted">
                        {item.hint}
                      </span>
                    </span>
                    {on ? (
                      <span className="mt-1 shrink-0 text-[0.625rem] font-bold uppercase tracking-[0.2em] text-adm-cyan-ink">
                        Aquí
                      </span>
                    ) : (
                      count > 0 && (
                        <span className="mt-0.5 shrink-0 bg-[#D4FF47] px-2 py-0.5 text-[0.6875rem] font-bold tabular-nums text-[#1E1E1E]">
                          {count} {count === 1 ? "nuevo" : "nuevos"}
                        </span>
                      )
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Pie: salir y la web */}
        <div className="shrink-0 border-t border-adm-line">
          <div className="mx-auto w-full max-w-2xl px-5 py-5 sm:px-7">
            <div className="mb-4">
              <p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-[0.25em] text-adm-faint">Tema</p>
              <ThemeSwitch initial={theme} tabIndex={open ? 0 : -1} />
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                tabIndex={open ? 0 : -1}
                className="flex w-full cursor-pointer items-center justify-center gap-2.5 border border-adm-line3 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-adm-ink transition-colors hover:border-adm-strong"
              >
                <LogOut size={15} strokeWidth={1.6} /> Cerrar sesión
              </button>
            </form>
            <p className="mt-4 text-center text-[0.6875rem] text-adm-soft">
              Sesión de {user} · La web pública está en{" "}
              <a
                href="/es"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={open ? 0 : -1}
                className="text-adm-ink underline underline-offset-2"
              >
                el inicio
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Barra de carga arriba mientras llega la página */}
      <div
        aria-hidden
        className={`fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden transition-opacity duration-200 ${going ? "opacity-100" : "opacity-0"}`}
      >
        <div className="adm-progress h-full w-1/3 bg-[#0FC0FC]" />
      </div>

      <main className={`${gutter} pb-14 pt-20 lg:pt-10`}>
        {leaving && <AdminSkeleton />}
        <div hidden={leaving}>{children}</div>
      </main>
    </div>
  );
}
