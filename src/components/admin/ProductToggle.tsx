"use client";

import { useOptimistic, useTransition } from "react";
import { toggleEdition, toggleProduct } from "@/src/app/admin/(panel)/actions/products";
import { toggleCombo } from "@/src/app/admin/(panel)/actions/combos";

/** Interruptor "a la venta" de un café (o "visible" de una edición o un combo) */
export default function ProductToggle({
  id,
  active,
  disabled,
  kind = "product",
}: {
  id: string;
  active: boolean;
  disabled?: boolean;
  kind?: "product" | "edition" | "combo";
}) {
  const [on, setOn] = useOptimistic(active);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? "Visible (tocar para ocultar)" : "Oculto (tocar para mostrar)"}
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await { product: toggleProduct, edition: toggleEdition, combo: toggleCombo }[kind](id, !on);
        })
      }
      className={`relative h-6 w-11 shrink-0 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        on ? "bg-[#0FC0FC]" : "bg-adm-line3"
      }`}
    >
      <span
        className={`absolute left-0 top-1 h-4 w-4 bg-adm-surface transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
