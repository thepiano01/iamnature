import { tempTone } from "@/lib/reviews";

/** 신뢰 온도 게이지 (당근 매너온도 스타일) */
export default function TrustTemp({ temp, size = "md" }: { temp: number; size?: "sm" | "md" }) {
  const t = tempTone(temp);
  const pct = Math.min(100, Math.max(4, ((temp - 20) / (60 - 20)) * 100));
  if (size === "sm")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-extrabold" style={{ color: t.color }} title="채취자 신뢰 온도">
        {temp.toFixed(1)}°C <span className="text-sm">{t.face}</span>
      </span>
    );
  return (
    <div className="w-full max-w-[220px]">
      <div className="flex items-end justify-end gap-1.5">
        <span className="text-lg font-extrabold tracking-[-0.02em]" style={{ color: t.color }}>{temp.toFixed(1)}°C</span>
        <span className="text-2xl leading-none">{t.face}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-hanji-200">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: t.color }} />
      </div>
      <p className="mt-1 text-right text-[11px] font-semibold text-bark-400 underline decoration-dotted" title="좋은 후기와 거래 완료가 쌓이면 올라가고, 나쁜 후기를 받으면 내려가요. 처음은 36.5°C에서 시작해요.">
        신뢰 온도 · 첫 온도 36.5°C
      </p>
    </div>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`별점 ${value}점`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
            <defs>
              <linearGradient id={`s${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="#f59e0b" />
                <stop offset={`${fill * 100}%`} stopColor="#e5ece9" />
              </linearGradient>
            </defs>
            <path fill={`url(#s${i}-${Math.round(fill * 100)})`} d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z" />
          </svg>
        );
      })}
    </span>
  );
}
