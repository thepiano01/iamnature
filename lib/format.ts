export const won = (n: number | null | undefined) => `${(n ?? 0).toLocaleString("ko-KR")}원`;

// 날짜는 항상 한국 시간(KST, UTC+9) 기준 — 서버(Vercel)가 UTC여도 같은 날짜가 나오도록
const KST = 9 * 3600 * 1000;
const DAY = 86400000;
const toDate = (d: Date | string) => (typeof d === "string" ? new Date(d) : d);
const kstDayNo = (t: number) => Math.floor((t + KST) / DAY);

export function ymd(d?: Date | string | null) {
  if (!d) return "";
  const k = new Date(toDate(d).getTime() + KST);
  return `${k.getUTCFullYear()}.${String(k.getUTCMonth() + 1).padStart(2, "0")}.${String(k.getUTCDate()).padStart(2, "0")}`;
}

export function daysAgo(d?: Date | string | null) {
  if (!d) return null;
  const x = toDate(d);
  const diff = kstDayNo(Date.now()) - kstDayNo(x.getTime());
  if (diff <= 0) return "오늘 채취";
  if (diff === 1) return "어제 채취";
  if (diff < 30) return `${diff}일 전 채취`;
  return `${ymd(x)} 채취`;
}

export function timeAgo(d?: Date | string | null) {
  if (!d) return "";
  const m = Math.floor((Date.now() - toDate(d).getTime()) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  if (m < 1440) return `${Math.floor(m / 60)}시간 전`;
  const days = kstDayNo(Date.now()) - kstDayNo(toDate(d).getTime());
  if (days < 7) return `${days}일 전`;
  return ymd(d);
}

export function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}
