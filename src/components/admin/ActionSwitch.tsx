"use client";

import { useOptimistic, useTransition } from "react";

/** Interruptor que llama a una acción del servidor con el nuevo valor */
export default function ActionSwitch({
  action,
  active,
  disabled,
  label,
}: {
  action: (active: boolean) => Promise<void>;
  active: boolean;
  disabled?: boolean;
  label: string;
}) {
  const [on, setOn] = useOptimistic(active);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={label}
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await action(!on);
        })
      }
      className={`relative h-6 w-11 shrink-0 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        on ? "bg-[#0FC0FC]" : "bg-adm-line3"
      }`}
    >
      <span className={`absolute left-0 top-1 h-4 w-4 bg-white transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
