import type { EffrPoint } from "@/features/sources";

const W = 420;
const H = 190;
const L = 34;
const R = 10;
const T = 14;
const B = 26;
/** 이 폭(%p) 이상 움직인 날을 정책 금리 변경으로 본다. */
const POLICY_MOVE = 0.15;

/** 최근 12개월 실효금리를 계단선으로 그린다. 값이 바뀐 날에 점을 찍는다. */
export function RateStepChart({
  points,
  label,
  monthLabel,
}: {
  points: EffrPoint[];
  label: string;
  monthLabel: (iso: string) => string;
}) {
  if (points.length === 0) return null;
  const times = points.map((p) => Date.parse(p.date));
  const start = times[0];
  const end = times[times.length - 1];
  const rates = points.map((p) => p.rate);
  const lo = Math.floor(Math.min(...rates) * 4) / 4 - 0.25;
  const hi = Math.ceil(Math.max(...rates) * 4) / 4 + 0.25;
  const x = (ms: number) => L + ((ms - start) / Math.max(1, end - start)) * (W - L - R);
  const y = (rate: number) => T + ((hi - rate) / (hi - lo)) * (H - T - B);

  let path = `M${x(times[0])},${y(points[0].rate)}`;
  const changes: EffrPoint[] = [];
  for (let i = 1; i < points.length; i++) {
    path += ` H${x(times[i])}`;
    if (points[i].rate !== points[i - 1].rate) {
      path += ` V${y(points[i].rate)}`;
      // 하루 단위의 작은 흔들림이 아니라 정책 금리 변경 수준의 변화에만 점을 찍는다.
      if (Math.abs(points[i].rate - points[i - 1].rate) >= POLICY_MOVE) changes.push(points[i]);
    }
  }
  const ticks: number[] = [];
  for (let v = Math.ceil(lo * 4) / 4; v <= hi; v += 0.25) ticks.push(v);
  const months: number[] = [];
  const first = new Date(start);
  for (let ms = Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1); ms <= end; ) {
    months.push(ms);
    const d = new Date(ms);
    ms = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 3, 1);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="stroke-border" />
          <text x={L - 6} y={y(v) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
            {v.toFixed(2)}
          </text>
        </g>
      ))}
      {months.map((ms) => (
        <text key={ms} x={x(ms)} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">
          {monthLabel(new Date(ms).toISOString().slice(0, 10))}
        </text>
      ))}
      <path d={path} className="fill-none stroke-primary" strokeWidth={2} />
      {changes.map((p) => (
        <circle
          key={p.date}
          cx={x(Date.parse(p.date))}
          cy={y(p.rate)}
          r={3.5}
          className="fill-background stroke-primary"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}
