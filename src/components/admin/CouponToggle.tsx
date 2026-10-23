"use client";

import { useOptimistic, useTransition } from "react";
import type { Coupon } from "@/src/lib/coupons";
import { toggleCoupon } from "@/src/app/admin/(panel)/actions/coupons";

/** Interruptor activo / pausado de un cupón */
export default function CouponToggle({
  coupon,
  disabled,
}: {
  coupon: Coupon;
  disabled?: boolean;
}) {
  const [on, setOn] = useOptimistic(coupon.active !== false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? `Pausar ${coupon.code}` : `Activar ${coupon.code}`}
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await toggleCoupon(coupon.code, !on, coupon);
        })
      }
      className={`relative h-6 w-11 shrink-0 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? "bg-[#0FC0FC]" : "bg-adm-line3"}`}
    >
      <span className={`absolute left-0 top-1 h-4 w-4 bg-adm-surface transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
