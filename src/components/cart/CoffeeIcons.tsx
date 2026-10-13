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

/* Molienda: partículas cada vez más pequeñas y numerosas */
const PARTICLES: Record<
  "coarse" | "medium" | "fine",
  [number, number, number][]
> = {
  coarse: [
    [8, 9, 3.2],
    [16, 10, 2.8],
    [11, 16.5, 3],
  ],
  medium: [
    [7, 8, 2],
    [13, 7, 1.8],
    [18, 10, 2],
    [9, 14, 1.9],
    [15, 15, 2],
    [12, 19.5, 1.8],
  ],
  fine: [
    [6, 7, 1],
    [10, 6, 1],
    [14, 7, 1],
    [18, 8, 1],
    [7, 11, 1],
    [11, 10.5, 1],
    [15, 11, 1],
    [19, 12, 1],
    [6, 15, 1],
    [10, 14.5, 1],
    [14, 15, 1],
    [18, 16, 1],
    [8, 19, 1],
    [12, 18.5, 1],
    [16, 19.5, 1],
  ],
};

function GroundIcon({
  level,
  ...props
}: IconProps & { level: keyof typeof PARTICLES }) {
  return (
    <svg {...base} {...props}>
      {PARTICLES[level].map(([cx, cy, r], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="currentColor"
          stroke="none"
        />
      ))}
    </svg>
  );
}

const GRIND_ICON: Record<GrindId, (p: IconProps) => React.ReactElement> = {
  wholeBean: BeanIcon,
  coarse: (p) => <GroundIcon level="coarse" {...p} />,
  medium: (p) => <GroundIcon level="medium" {...p} />,
  fine: (p) => <GroundIcon level="fine" {...p} />,
};

export function GrindIcon({ grind, ...props }: IconProps & { grind: GrindId }) {
  const Icon = GRIND_ICON[grind];
  return <Icon {...props} />;
}

export function SizeIcon({ size, ...props }: IconProps & { size: SizeId }) {
  return <BagIcon large={size === "1kg"} {...props} />;
}
