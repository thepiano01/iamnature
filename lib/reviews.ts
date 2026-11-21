// 후기 태그·신뢰 온도 — 화면과 서버 공용 (DB 접근 없음)

export const GOOD_TAGS = ["신선해요", "향이 진해요", "양이 넉넉해요", "손질이 깔끔해요", "포장이 꼼꼼해요", "배송이 빨라요", "설명과 같아요", "친절해요", "또 살게요"] as const;
export const BAD_TAGS = ["시들었어요", "양이 적어요", "손질이 아쉬워요", "포장이 아쉬워요", "배송이 늦어요", "설명과 달라요"] as const;
const ALL = new Set<string>([...GOOD_TAGS, ...BAD_TAGS]);

export function parseTags(raw: string | null | undefined) {
  return (raw || "").split(",").map((t) => t.trim()).filter((t) => ALL.has(t));
}
export function parsePhotos(raw: string | null | undefined) {
  return (raw || "").split(",").map((t) => t.trim()).filter(Boolean);
}

export const BASE_TEMP = 36.5;

/**
 * 채취자 신뢰 온도 (당근 매너온도 방식)
 * - 36.5°C에서 시작
 * - 후기 별점: 5점 +0.6 / 4점 +0.3 / 3점 0 / 2점 -0.6 / 1점 -1.2 (나쁜 평가는 두 배로 반영)
 * - 거래 완료 1건당 +0.05
 * - 20.0 ~ 99.0 사이
 */
export function trustTemp(ratings: number[], completedSales: number) {
  const delta = ratings.reduce((s, r) => s + (r >= 3 ? (r - 3) * 0.3 : (r - 3) * 0.6), 0) + completedSales * 0.05;
  return Math.round(Math.min(99, Math.max(20, BASE_TEMP + delta)) * 10) / 10;
}

export function tempTone(t: number) {
  if (t < 32) return { color: "#3b82f6", bg: "bg-sky2-100", face: "😟", label: "주의" };
  if (t < 36.5) return { color: "#38bdf8", bg: "bg-sky2-100", face: "🙂", label: "보통" };
  if (t < 40) return { color: "#14b8a6", bg: "bg-forest-50", face: "😊", label: "좋음" };
  if (t < 50) return { color: "#22c55e", bg: "bg-forest-50", face: "😄", label: "아주 좋음" };
  return { color: "#ff8a65", bg: "bg-clay-50", face: "🥰", label: "최고" };
}

export function summarize(reviews: { rating: number; tags: string }[]) {
  const n = reviews.length;
  const avg = n ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / n) * 10) / 10 : 0;
  const tagCount = new Map<string, number>();
  for (const r of reviews) for (const t of parseTags(r.tags)) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  const goodTags = GOOD_TAGS.map((t) => ({ tag: t, n: tagCount.get(t) ?? 0 })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const dist = [5, 4, 3, 2, 1].map((s) => ({ star: s, n: reviews.filter((r) => r.rating === s).length }));
  return { n, avg, goodTags, dist };
}

/** 이름 가리기: 홍길동 → 홍*동, 김수 → 김* */
export function maskName(name?: string | null) {
  const s = (name || "구매자").trim();
  if (s.length <= 1) return s + "*";
  if (s.length === 2) return s[0] + "*";
  return s[0] + "*".repeat(s.length - 2) + s[s.length - 1];
}
