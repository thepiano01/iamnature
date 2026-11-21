/** 매칭률 링 (0~100) */
export default function MatchRing({ value, size = 44, stroke = 5, label, tone = "mint" }: { value: number; size?: number; stroke?: number; label?: string; tone?: "mint" | "peach" | "lilac" | "sky" | "butter" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const color = { mint: "#14b8a6", peach: "#ff8a65", lilac: "#8b5cf6", sky: "#38bdf8", butter: "#f59e0b" }[tone];
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-hanji-200" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
      </svg>
      <span className="absolute text-[10px] font-extrabold text-bark-900" style={{ fontSize: Math.max(9, size / 4.4) }}>
        {label ?? `${Math.round(v)}%`}
      </span>
    </span>
  );
}

export const RING_TONES = ["mint", "peach", "lilac", "sky", "butter"] as const;
