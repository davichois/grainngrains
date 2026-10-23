import Link from "next/link";
import { Database } from "lucide-react";

/* ───────────────────────────────────────────────────────────────
   Piezas visuales del panel: tarjetas, cifras, etiquetas de estado,
   encabezados y campos. Mismo estilo del menú: fondo blanco, líneas
   finas, sin esquinas redondeadas ni sombras, etiquetas pequeñas en
   mayúsculas; blancos y grises con los colores de Fairtrade (azul, lima y negro)
   como acento, en Fira Sans.
─────────────────────────────────────────────────────────────── */

export const fieldCls =
  "w-full border border-adm-line3 bg-adm-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-adm-faint hover:border-adm-faint focus:border-[#0FC0FC] disabled:bg-adm-subtle disabled:text-adm-soft";

export const labelCls =
  "mb-2 block text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-adm-muted";

const btnBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 border px-5 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export const btnPrimary = `${btnBase} border-[#0FC0FC] bg-[#0FC0FC] text-[#1E1E1E] hover:border-adm-strong hover:bg-adm-solid hover:text-white`;

export const btnGhost = `${btnBase} border-adm-line3 bg-adm-surface text-adm-ink hover:border-adm-strong`;

export const btnDanger = `${btnBase} border-adm-red-line bg-adm-surface text-adm-red hover:border-adm-red`;

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-adm-line pb-8 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      {/* Textos de la sección a la izquierda; acciones a la derecha */}
      <div className="min-w-0">
        {kicker && (
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-adm-faint">
            {kicker}
          </p>
        )}
        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[0.8125rem] leading-relaxed text-adm-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  aside,
  children,
  className = "",
  padded = true,
}: {
  title?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`border border-adm-line bg-adm-surface ${className}`}
    >
      {(title || aside) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-adm-line px-5 py-4 sm:px-7">
          {title && (
            <h2 className="text-[0.625rem] font-semibold uppercase tracking-[0.25em] text-adm-muted">
              {title}
            </h2>
          )}
          {aside}
        </div>
      )}
      <div className={padded ? "p-5 sm:p-7" : ""}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent = false,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden border p-5 sm:p-6 ${
        accent
          ? "border-[#D4FF47] bg-[#D4FF47] text-[#1E1E1E]"
          : "border-adm-line bg-adm-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`text-[0.625rem] font-semibold uppercase tracking-[0.22em] ${
            accent ? "text-[#1E1E1E]/60" : "text-adm-muted"
          }`}
        >
          {label}
        </p>
        {icon && (
          <span className={accent ? "text-[#1E1E1E]" : "text-adm-faint"}>{icon}</span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.75rem]">
        {value}
      </p>
      {hint && (
        <p className={`mt-1 text-xs ${accent ? "text-[#1E1E1E]/60" : "text-adm-muted"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

const BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pago pendiente", cls: "border-adm-line3 text-adm-muted" },
  paid: { label: "Pagado · por preparar", cls: "border-[#0FC0FC] bg-[#0FC0FC] text-[#1E1E1E]" },
  preparing: { label: "Preparando", cls: "border-adm-cyan-line bg-adm-cyan-tint text-adm-cyan-ink" },
  shipped: { label: "Enviado", cls: "border-adm-strong bg-adm-solid text-white" },
  delivered: { label: "Entregado", cls: "border-[#D4FF47] bg-[#D4FF47] text-[#1E1E1E]" },
  cancelled: { label: "Cancelado", cls: "border-adm-line2 text-adm-faint" },
  refunded: { label: "Reembolsado", cls: "border-adm-line2 text-adm-faint" },
  rejected: { label: "Pago rechazado", cls: "border-adm-red-line text-adm-red" },
  new: { label: "Nuevo", cls: "border-[#D4FF47] bg-[#D4FF47] text-[#1E1E1E]" },
  replied: { label: "Respondido", cls: "border-adm-cyan-line bg-adm-cyan-tint text-adm-cyan-ink" },
  closed: { label: "Cerrado", cls: "border-adm-line2 text-adm-faint" },
  active: { label: "Activo", cls: "border-[#D4FF47] bg-adm-lime-tint text-adm-lime-ink" },
  paused: { label: "Pausado", cls: "border-adm-line2 text-adm-faint" },
  hidden: { label: "Oculto", cls: "border-adm-line2 text-adm-faint" },
  soldout: { label: "Agotado", cls: "border-adm-red-line text-adm-red" },
};

export const statusLabel = (s: string) => BADGE[s]?.label ?? s;

export function Badge({ status, label }: { status: string; label?: string }) {
  const b = BADGE[status] ?? { label: status, cls: "border-adm-line3 text-adm-muted" };
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border px-2 py-1 text-[0.5625rem] font-semibold uppercase tracking-[0.18em] ${b.cls}`}
    >
      {label ?? b.label}
    </span>
  );
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center border border-adm-line bg-adm-surface px-6 py-16 text-center">
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-adm-muted">
        {title}
      </p>
      {text && <p className="mt-3 max-w-sm text-[0.8125rem] leading-relaxed text-adm-soft">{text}</p>}
    </div>
  );
}

/** Aviso cuando Supabase aún no está conectado */
export function DbNotice() {
  return (
    <div className="mb-8 flex items-start gap-4 border-l-2 border-[#0FC0FC] bg-adm-cyan-tint px-5 py-4 text-[0.8125rem] leading-relaxed text-adm-sub">
      <Database size={17} strokeWidth={1.5} className="mt-0.5 shrink-0" />
      <p>
        <strong className="font-semibold text-adm-ink">Supabase aún no está conectado.</strong> Ejecuta{" "}
        <code>supabase/schema.sql</code> en tu proyecto de Supabase y agrega{" "}
        <code>SUPABASE_URL</code> y <code>SUPABASE_SERVICE_ROLE_KEY</code> al{" "}
        <code>.env</code>. Mientras tanto ves los datos del código, sin poder
        guardar cambios. <Link href="/admin/ajustes" className="font-semibold text-adm-ink underline underline-offset-2">Ver estado</Link>
      </p>
    </div>
  );
}

export const money = (n: number) =>
  `S/ ${Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "short",
  });
