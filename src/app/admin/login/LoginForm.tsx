"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined,
  );
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-adm-muted">
          Usuario
        </span>
        <input
          name="username"
          autoComplete="username"
          required
          autoFocus
          className="w-full border border-adm-line2 bg-adm-surface px-4 py-3 text-[0.9375rem] font-medium outline-none transition focus:border-adm-strong"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-adm-muted">
          Contraseña
        </span>
        <span className="relative block">
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className="w-full border border-adm-line2 bg-adm-surface px-4 py-3 pr-12 text-[0.9375rem] font-medium outline-none transition focus:border-adm-strong"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute inset-y-0 right-2 my-auto flex h-9 w-9 cursor-pointer items-center justify-center text-adm-muted hover:text-adm-ink"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      {state?.error && (
        <p
          role="alert"
          className="bg-adm-red-tint px-4 py-3 text-sm font-medium text-adm-red"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group flex w-full cursor-pointer items-center justify-center gap-2 border border-[#0FC0FC] bg-[#0FC0FC] px-6 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[#1E1E1E] transition-colors hover:border-adm-strong hover:bg-adm-solid hover:text-white disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Lock size={16} />
        )}
        Entrar
        <ArrowRight
          size={18}
          className="transition-transform group-hover:translate-x-1"
        />
      </button>
    </form>
  );
}
