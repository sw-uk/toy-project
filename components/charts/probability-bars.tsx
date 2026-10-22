const W = 420;
const H = 190;
const L = 34;
const R = 10;
const T = 14;
const B = 26;

export type Bar = {
  key: string;
  label: string;
  percent: number;
  surprise: boolean;
};

/** 회의 한 달 전 인상 확률 막대. 의외의 결과였던 회의는 다른 색으로 그린다. */
export function ProbabilityBars({ bars, label }: { bars: Bar[]; label: string }) {
  if (bars.length === 0) return null;
  const top = Math.max(50, Math.ceil(Math.max(...bars.map((b) => b.percent)) / 25) * 25);
  const slot = (W - L - R) / bars.length;
  const y = (v: number) => T + ((top - v) / top) * (H - T - B);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full">
      {[0, top / 2, top].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="stroke-border" />
          <text x={L - 6} y={y(v) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
            {Math.round(v)}%
          </text>
        </g>
      ))}
      {bars.map((bar, i) => {
        const bx = L + i * slot + slot * 0.2;
        const bw = slot * 0.6;
        const barTop = y(bar.percent);
        return (
          <g key={bar.key}>
            <rect
              x={bx}
              y={barTop}
              width={bw}
              height={Math.max(1, H - B - barTop)}
              rx={3}
              className={bar.surprise ? "fill-destructive" : "fill-muted-foreground"}
            />
            <text x={bx + bw / 2} y={barTop - 4} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {bar.percent}%
            </text>
            <text x={bx + bw / 2} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
