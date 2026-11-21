// 사진이 없는 상품용 일러스트 — 카테고리별로 다른 선화(line art)
const PALETTE: Record<string, [string, string, string]> = {
  HERB: ["#e6fbf5", "#b9f0e1", "#0f766e"],
  ROOT: ["#fff1ea", "#ffd6c6", "#d4552b"],
  MUSHROOM: ["#f3f0ff", "#ddd5fe", "#6d4fd8"],
  FRUIT: ["#fff8e1", "#fde7a8", "#c2780a"],
};

function Glyph({ category, color }: { category: string; color: string }) {
  const s = { stroke: color, strokeWidth: 2.2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (category) {
    case "ROOT":
      return (
        <g {...s}>
          <path d="M100 52c-6 10-4 18 0 24 4-6 6-14 0-24Z" />
          <path d="M100 52c10-8 22-8 30-2-8 6-20 7-30 2Z" />
          <path d="M100 52c-10-8-22-8-30-2 8 6 20 7 30 2Z" />
          <path d="M100 76c-10 14-12 34-6 54 2 8 8 16 6 22" />
          <path d="M100 76c8 16 10 36 4 56-2 8-6 14-4 20" />
          <path d="M96 110c-10 4-18 12-22 22M104 118c10 4 16 12 20 22M98 140c-6 6-8 12-8 18" />
        </g>
      );
    case "MUSHROOM":
      return (
        <g {...s}>
          <path d="M58 104c0-26 19-44 42-44s42 18 42 44c-14 6-28 8-42 8s-28-2-42-8Z" />
          <path d="M88 112c-2 16-4 30-2 44h28c2-14 0-28-2-44" />
          <path d="M80 80h.01M112 74h.01M122 92h.01M96 92h.01" strokeWidth={5} />
          <path d="M70 156c20-4 40-4 60 0" />
        </g>
      );
    case "FRUIT":
      return (
        <g {...s}>
          <path d="M100 56c-2 14-10 22-20 30M100 56c4 16 14 24 24 30M100 56v-8" />
          <path d="M100 48c8-8 20-10 28-6-6 8-18 10-28 6Z" />
          <circle cx="78" cy="104" r="16" />
          <circle cx="122" cy="104" r="16" />
          <circle cx="100" cy="130" r="17" />
        </g>
      );
    default:
      return (
        <g {...s}>
          <path d="M100 160V70" />
          <path d="M100 120c-22-2-38-16-42-38 22 0 38 14 42 38Z" />
          <path d="M100 100c20-4 34-20 36-42-20 2-34 18-36 42Z" />
          <path d="M100 74c-8-6-12-16-10-26 10 4 14 14 10 26Z" />
          <path d="M78 98l14 12M120 76l-12 14" />
        </g>
      );
  }
}

export default function ProductArt({ category, label, className = "" }: { category?: string | null; label?: string; className?: string }) {
  const c = category && PALETTE[category] ? category : "HERB";
  const [a, b, ink] = PALETTE[c];
  const id = `g-${c}`;
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={label ?? "상품 이미지"}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${id})`} />
      <circle cx="160" cy="40" r="56" fill="#fff" opacity="0.45" />
      <circle cx="30" cy="180" r="50" fill="#fff" opacity="0.35" />
      <g opacity="0.9">
        <Glyph category={c} color={ink} />
      </g>
    </svg>
  );
}
