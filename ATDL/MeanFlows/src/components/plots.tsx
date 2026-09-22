import { useId, type ReactNode, type PointerEvent } from "react";
import type { Vec } from "../math/flow";
export const colors = {
  noise: "#b7a6ed",
  data: "#cbe7ae",
  instant: "#edb177",
  average: "#7bcfc1",
  muted: "#728381",
};
export const xy = (z: Vec): Vec => [280 + z[0] * 66, 170 - z[1] * 66];
export const pathD = (points: Vec[]) =>
  points.map((p, i) => `${i ? "L" : "M"}${xy(p).join(",")}`).join(" ");
export function Plot({
  children,
  label,
  wide = false,
}: {
  children: ReactNode;
  label: string;
  wide?: boolean;
}) {
  return (
    <svg
      className="plot-svg"
      viewBox={wide ? "0 0 820 340" : "0 0 560 340"}
      role="group"
      aria-label={label}
    >
      <defs>
        <pattern
          id={useId()}
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".6" fill="#647976" />
        </pattern>
      </defs>
      {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
        <g key={i} opacity={i === 0 ? 0.3 : 0.1}>
          <line
            x1={280 + i * 66}
            x2={280 + i * 66}
            y1="15"
            y2="325"
            stroke="white"
          />
          <line
            y1={170 + i * 66}
            y2={170 + i * 66}
            x1="30"
            x2="530"
            stroke="white"
          />
        </g>
      ))}
      {children}
    </svg>
  );
}
export function Arrow({
  from,
  to,
  color = colors.average,
  label,
  dashed = false,
}: {
  from: Vec;
  to: Vec;
  color?: string;
  label?: string;
  dashed?: boolean;
}) {
  const id = useId().replace(/:/g, ""),
    [x1, y1] = xy(from),
    [x2, y2] = xy(to);
  return (
    <g>
      <defs>
        <marker
          id={id}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L7,3 z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="2.3"
        strokeDasharray={dashed ? "5 4" : undefined}
        markerEnd={`url(#${id})`}
      />
      {label && (
        <text x={x2 + 10} y={y2 - 9} fill={color} fontSize="13">
          {label}
        </text>
      )}
    </g>
  );
}
export function Dot({
  point,
  label,
  color = colors.data,
}: {
  point: Vec;
  label?: string;
  color?: string;
}) {
  const [cx, cy] = xy(point);
  return (
    <g>
      <circle cx={cx} cy={cy} r="5" fill={color} />
      {label && (
        <text x={cx + 10} y={cy + 20} fill={color} fontSize="13">
          {label}
        </text>
      )}
    </g>
  );
}
export function DragPoint({
  point,
  onChange,
  label,
  color = colors.data,
}: {
  point: Vec;
  onChange: (p: Vec) => void;
  label: string;
  color?: string;
}) {
  const move = (e: PointerEvent<SVGCircleElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const svg = e.currentTarget.ownerSVGElement!,
      pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const actual = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    onChange([
      Math.max(-3.3, Math.min(3.3, (actual.x - 280) / 66)),
      Math.max(-2.1, Math.min(2.1, (170 - actual.y) / 66)),
    ]);
  };
  const [cx, cy] = xy(point);
  return (
    <g>
      <circle
        className="drag-dot"
        role="button"
        tabIndex={0}
        aria-label={`${label}. Drag or use arrow keys to move.`}
        cx={cx}
        cy={cy}
        r="11"
        fill={color}
        stroke="#fff"
        strokeWidth="2"
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerMove={move}
        onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
        onKeyDown={(e) => {
          const delta: Record<string, Vec> = {
            ArrowLeft: [-0.1, 0],
            ArrowRight: [0.1, 0],
            ArrowUp: [0, 0.1],
            ArrowDown: [0, -0.1],
          };
          if (delta[e.key]) {
            e.preventDefault();
            onChange([
              Math.max(-3.3, Math.min(3.3, point[0] + delta[e.key][0])),
              Math.max(-2.1, Math.min(2.1, point[1] + delta[e.key][1])),
            ]);
          }
        }}
      />
      <text x={cx + 16} y={cy - 15} fill={color} fontSize="13">
        {label}
      </text>
    </g>
  );
}
export function Legend() {
  return (
    <div className="legend">
      <span style={{ color: colors.noise }}>● Noise</span>
      <span style={{ color: colors.data }}>● Data</span>
      <span style={{ color: colors.instant }}>↗ Instantaneous v</span>
      <span style={{ color: colors.average }}>↗ Average u</span>
    </div>
  );
}
