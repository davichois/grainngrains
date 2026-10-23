"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteCoupon } from "@/src/app/admin/(panel)/actions/coupons";
import { btnDanger } from "./ui";

/** Eliminar un cupón (pide confirmación). `compact` = solo el ícono, para la lista */
export default function DeleteCouponButton({
  code,
  fromCode,
  disabled,
  compact,
}: {
  code: string;
  /** Es del código: queda oculto en vez de borrarse */
  fromCode: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const onClick = () => {
    const msg = fromCode
      ? `¿Eliminar el cupón ${code}? Es del código: queda oculto y lo puedes restaurar.`
      : `¿Eliminar el cupón ${code}? Se borra para siempre.`;
    if (!window.confirm(msg)) return;
    start(async () => {
      const r = await deleteCoupon(code);
      if (r?.error) setError(r.error);
    });
  };
  const title = disabled ? "Conecta Supabase para eliminar cupones" : `Eliminar ${code}`;

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        title={title}
        aria-label={title}
        className={
          compact
            ? "flex h-9 w-9 cursor-pointer items-center justify-center border border-adm-red-line text-adm-red transition-colors hover:border-adm-red hover:bg-adm-red-tint disabled:cursor-not-allowed disabled:opacity-40"
            : btnDanger
        }
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        {!compact && "Eliminar"}
      </button>
      {error && <span className="mt-1 text-xs text-adm-red">{error}</span>}
    </span>
  );
}
