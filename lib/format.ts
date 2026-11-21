export const won = (n: number | null | undefined) => `${(n ?? 0).toLocaleString("ko-KR")}원`;

export function ymd(d?: Date | string | null) {
  if (!d) return "";
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, "0")}.${String(x.getDate()).padStart(2, "0")}`;
}

export function daysAgo(d?: Date | string | null) {
  if (!d) return null;
  const x = typeof d === "string" ? new Date(d) : d;
  const diff = Math.floor((Date.now() - x.getTime()) / 86400000);
  if (diff <= 0) return "오늘 채취";
  if (diff === 1) return "어제 채취";
  if (diff < 30) return `${diff}일 전 채취`;
  return `${ymd(x)} 채취`;
}

export function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}
