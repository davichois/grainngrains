import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";

/* Campos con etiqueta flotante (estilo checkout de Shopify): la etiqueta
   ocupa el lugar del placeholder y sube al enfocar o al escribir */

const box =
  "peer w-full rounded-xl border border-gray-300 bg-white px-3 pb-1.5 pt-5 text-sm text-gray-900 transition-colors focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-gray-900 user-invalid:border-red-500 user-invalid:ring-1 user-invalid:ring-inset user-invalid:ring-red-500";

const floating =
  "pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-gray-500 transition-all peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  /** Texto fijo antes del valor (p. ej. "+51") */
  prefix?: string;
  hint?: ReactNode;
  wrapperClassName?: string;
}

export function Field({
  id,
  label,
  prefix,
  hint,
  wrapperClassName = "",
  className = "",
  ...props
}: FieldProps) {
  return (
    <div className={wrapperClassName}>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`${box} ${prefix ? "pl-11" : ""} ${className}`}
          {...props}
        />
        {prefix && (
          /* El prefijo aparece cuando la etiqueta sube (enfocado o con valor) */
          <span className="pointer-events-none absolute bottom-1.5 left-3 text-sm text-gray-500 opacity-0 transition-opacity peer-focus:opacity-100 peer-[:not(:placeholder-shown)]:opacity-100">
            {prefix}
          </span>
        )}
        <label htmlFor={id} className={`${floating} left-3`}>
          {label}
        </label>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  wrapperClassName?: string;
  children: ReactNode;
}

/** Select con la etiqueta siempre arriba (como "País/Región" en Shopify) */
export function SelectField({
  id,
  label,
  wrapperClassName = "",
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <select id={id} className={`${box} appearance-none pr-9`} {...props}>
        {children}
      </select>
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-2 text-[11px] text-gray-500"
      >
        {label}
      </label>
      <ChevronDown
        size={16}
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
      />
    </div>
  );
}

/** Insignias de medios de pago con los colores de cada marca */
export function PaymentBadge({
  brand,
}: {
  brand: "yape" | "plin" | "visa" | "mastercard" | "amex";
}) {
  const common =
    "inline-flex h-5 min-w-9 items-center justify-center rounded px-1.5 text-[10px] leading-none text-white";
  switch (brand) {
    case "yape":
      return (
        <span className={`${common} bg-[#742284] font-extrabold lowercase`}>
          yape
        </span>
      );
    case "plin":
      return (
        <span
          className={`${common} bg-linear-to-r from-[#00c2d1] to-[#0d8ee9] font-extrabold lowercase`}
        >
          plin
        </span>
      );
    case "visa":
      return (
        <span className={`${common} bg-[#1a1f71] font-black italic`}>VISA</span>
      );
    case "amex":
      return <span className={`${common} bg-[#2e77bc] font-black`}>AMEX</span>;
    case "mastercard":
      return (
        <span className={`${common} gap-0 border border-gray-200 bg-white`}>
          <span className="h-3 w-3 rounded-full bg-[#eb001b]" />
          <span className="-ml-1.5 h-3 w-3 rounded-full bg-[#f79e1b]/90" />
        </span>
      );
  }
}
