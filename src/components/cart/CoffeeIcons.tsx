import type { SVGProps } from "react";
import type { GrindId, SizeId } from "@/src/lib/shop";

/* Íconos de línea (24×24, heredan el color del texto) para las opciones
   de presentación y molienda del selector */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** Bolsa de café; `large` dibuja la bolsa grande (1 kg) */
export function BagIcon({ large, ...props }: IconProps & { large?: boolean }) {
  return (
    <svg {...base} {...props}>
      {large ? (
        <>
          <path d="M5 6.5h14l1 2.2V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8.7z" />
          <path d="M5 6.5V3h14v3.5" />
          <circle cx="12" cy="11" r="1.4" />
          <path d="M7.5 15h9M7.5 17.5h6" />
        </>
      ) : (
        <>
          <path d="M8 9.5h8l.8 1.6V20a1 1 0 0 1-1 1H8.2a1 1 0 0 1-1-1v-8.9z" />
          <path d="M8 9.5V7h8v2.5" />
          <circle cx="12" cy="13.2" r="1" />
          <path d="M9.5 16.5h5" />
        </>
      )}
    </svg>
  );
}

function BeanIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="12" cy="12" rx="6" ry="8.5" transform="rotate(35 12 12)" />
      <path d="M8.3 6.6c2.6 1.8 3 4.3 1.2 6.4-1.6 1.9-1.4 3.7.8 5" />
    </svg>
  );
}

function DripperIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 6h13l-4 7.5h-5z" />
      <path d="M17.2 7.5h1.6a1.5 1.5 0 0 1 0 3h-2.4" />
      <path d="M11 13.5v1.5" />
      <path d="M6.5 17h9v2.5a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5z" />
    </svg>
  );
}

function EspressoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="3" width="16" height="6" rx="1" />
      <path d="M9 9v2h6V9" />
      <path d="M12 11v1.5" />
      <path d="M8.5 14h6v3a2.5 2.5 0 0 1-2.5 2.5h-1A2.5 2.5 0 0 1 8.5 17z" />
      <path d="M14.5 15h1a1.2 1.2 0 0 1 0 2.4h-1" />
      <path d="M4 21h16" />
    </svg>
  );
}

function FrenchPressIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M11.5 2.5v8.5" />
      <path d="M9.5 2.5h4" />
      <path d="M6.5 6.5h10V20a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1z" />
      <path d="M6.5 11h10" />
      <path d="M16.5 8.5h1.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-1.5" />
    </svg>
  );
}

function ColdBrewIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.5h12v2.5H6z" />
      <path d="M7 6h10v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
      <rect x="9" y="10.5" width="3" height="3" rx="0.5" />
      <rect x="12.3" y="14.5" width="3" height="3" rx="0.5" />
    </svg>
  );
}

function PercolatorIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M11 2.5h2V4" />
      <path d="M7.5 4h9l-1.2 6H8.7z" />
      <path d="M8.7 10h6.6" />
      <path d="M8.7 10 7.5 20a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1l-1.2-10" />
      <path d="M16.5 5.5h2l-1.4 4" />
    </svg>
  );
}

const GRIND_ICON: Record<GrindId, (p: IconProps) => React.ReactElement> = {
  wholeBean: BeanIcon,
  coarseDrip: DripperIcon,
  drip: DripperIcon,
  xfDrip: DripperIcon,
  frenchPress: FrenchPressIcon,
  toddy: ColdBrewIcon,
  perkPress: PercolatorIcon,
  coarseEspresso: EspressoIcon,
  espresso: EspressoIcon,
  xfEspresso: EspressoIcon,
};

export function GrindIcon({ grind, ...props }: IconProps & { grind: GrindId }) {
  const Icon = GRIND_ICON[grind];
  return <Icon {...props} />;
}

export function SizeIcon({ size, ...props }: IconProps & { size: SizeId }) {
  return <BagIcon large={size === "1kg"} {...props} />;
}
