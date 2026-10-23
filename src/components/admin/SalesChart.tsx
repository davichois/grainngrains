import { money } from "./ui";

/** Barras de ventas por día (SVG, sin librerías). Cada barra tiene su
 *  título con el día y el monto al pasar el mouse */
export default function SalesChart({
  data,
}: {
  data: { day: string; total: number; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const W = 600;
  const H = 180;
  const gap = 4;
  const bw = (W - gap * (data.length - 1)) / data.length;
  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H + 22}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Ventas de los últimos ${data.length} días: ${money(total)}`}
      >
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={W}
            y1={H - H * f}
            y2={H - H * f}
            className="stroke-adm-line"
            strokeWidth={1}
          />
        ))}
        {data.map((d, i) => {
          const h = d.total ? Math.max(4, (d.total / max) * (H - 8)) : 2;
          const x = i * (bw + gap);
          const last = i === data.length - 1;
          return (
            <g key={d.day}>
              <rect
                x={x}
                y={H - h}
                width={bw}
                height={h}
                rx={Math.min(6, bw / 2)}
                className={last ? "fill-adm-ink" : d.total ? "fill-[#0FC0FC]" : "fill-adm-line2"}
              >
                <title>
                  {`${new Date(`${d.day}T12:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}: ${money(d.total)} · ${d.count} pedido${d.count === 1 ? "" : "s"}`}
                </title>
              </rect>
              {(i % 5 === 0 || last) && (
                <text
                  x={x + bw / 2}
                  y={H + 16}
                  textAnchor="middle"
                  fontSize={11}
                  className="fill-adm-soft"
                >
                  {new Date(`${d.day}T12:00:00`).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                  })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
