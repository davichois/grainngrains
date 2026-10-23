"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { btnPrimary } from "./ui";

type State = { ok?: string; error?: string } | undefined;

/**
 * Formulario de una acción del panel con su mensaje de resultado
 * (guardado / error) y el botón que muestra "Guardando…".
 */
export default function ActionForm({
  action,
  children,
  submit = "Guardar",
  submitClass = btnPrimary,
  className = "space-y-4",
  footer,
  confirm,
}: {
  action: (prev: State, form: FormData) => Promise<State>;
  children: React.ReactNode;
  submit?: React.ReactNode;
  submitClass?: string;
  className?: string;
  footer?: React.ReactNode;
  /** Pregunta antes de enviar (para acciones que borran) */
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      {state?.error && (
        <p
          role="alert"
          className="flex items-start gap-2 bg-adm-red-tint px-4 py-3 text-sm font-medium text-adm-red"
        >
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}
      {state?.ok && !pending && (
        <p
          role="status"
          className="adm-fade flex items-start gap-2 border-l-2 border-[#0FC0FC] bg-adm-cyan-tint px-4 py-3 text-[0.8125rem] font-medium text-adm-ink"
        >
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          {state.ok}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={submitClass}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {submit}
        </button>
        {footer}
      </div>
    </form>
  );
}
