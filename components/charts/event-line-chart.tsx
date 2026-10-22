const W = 420;
const H = 190;
const L = 34;
const R = 10;
const T = 14;
const B = 26;

export type Marker = { t: number; size: number };

/** 이벤트 직전 확률 변화. 발표 시각에 세로선, 큰 베팅 위치에 점을 찍는다. */
export function EventLineChart({
  points,
  announcementAt,
  markers,
  label,
  hourLabel,
}: {
  points: { t: number; percent: number }[];
  announcementAt: number;
  markers: Marker[];
  label: string;
  hourLabel: (hoursBefore: number) => string;
}) {
  if (points.length < 2) return null;
  const start = points[0].t;
  const end = Math.max(points[points.length - 1].t, announcementAt);
  const x = (t: number) => L + ((t - start) / Math.max(1, end - start)) * (W - L - R);
  const y = (p: number) => T + ((100 - p) / 100) * (H - T - B);
  const path = points
    .map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.percent).toFixed(1)}`)
    .join(" ");
  const nearest = (t: number) =>
    points.reduce((best, p) => (Math.abs(p.t - t) < Math.abs(best.t - t) ? p : best));
  const hours = (end - start) / 3_600_000;
  const step = hours > 6 ? 2 : 1;
  const ticks = Array.from({ length: Math.floor(hours / step) + 1 }, (_, k) => k * step);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full">
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="stroke-border" />
          <text x={L - 6} y={y(v) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
            {v}%
          </text>
        </g>
      ))}
      {ticks.map((h) => (
        <text
          key={h}
          x={x(end - h * 3_600_000)}
          y={H - 8}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          {hourLabel(h)}
        </text>
      ))}
      <line
        x1={x(announcementAt)}
        x2={x(announcementAt)}
        y1={T}
        y2={H - B}
        className="stroke-foreground"
        strokeWidth={1.5}
      />
      <path d={path} className="fill-none stroke-primary" strokeWidth={2} />
      {markers.map((m) => {
        const p = nearest(m.t);
        return (
          <circle key={m.t} cx={x(m.t)} cy={y(p.percent)} r={m.size} className="fill-destructive" fillOpacity={0.85} />
        );
      })}
    </svg>
  );
}
