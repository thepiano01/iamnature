import credits from "./photoCredits.json";

export type PhotoCredit = { author: string; license: string; source: string; title: string };
const MAP = credits as Record<string, PhotoCredit>;

/** 위키미디어 공용 사진이면 출처 정보 반환 */
export function creditOf(url: string): PhotoCredit | null {
  return MAP[url] ?? null;
}
export function allCredits() {
  return Object.entries(MAP).map(([url, c]) => ({ url, ...c }));
}
