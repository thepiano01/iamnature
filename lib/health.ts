// 건강상태 정의 — 한 곳에서 관리합니다.
// key: User 테이블의 boolean 필드 / code: Condition.code (PlantCondition 매칭에 사용)

export const HEALTH = [
  { key: "healthDiabetes", code: "DIABETES", emoji: "🍬", label: "당뇨", desc: "혈당 관리" },
  { key: "healthHypertension", code: "HYPERTENSION", emoji: "🩺", label: "혈압", desc: "혈압 관리" },
  { key: "healthHeart", code: "HEART", emoji: "❤️", label: "심장", desc: "심혈관 건강" },
  { key: "healthHyperlipid", code: "HYPERLIPID", emoji: "🧈", label: "고지혈", desc: "콜레스테롤 관리" },
  { key: "healthJoint", code: "JOINT", emoji: "🦵", label: "관절", desc: "관절·뼈 건강" },
  { key: "healthLiver", code: "LIVER", emoji: "🍃", label: "간", desc: "간 건강" },
  { key: "healthKidney", code: "KIDNEY", emoji: "💧", label: "신장", desc: "신장 건강" },
  { key: "healthStomach", code: "STOMACH", emoji: "🥣", label: "위·소화", desc: "속 편한 식단" },
  { key: "healthRespiratory", code: "RESPIRATORY", emoji: "🌬️", label: "기관지", desc: "호흡기·목 건강" },
  { key: "healthImmune", code: "IMMUNE", emoji: "🛡️", label: "면역", desc: "면역력 관리" },
  { key: "healthFatigue", code: "FATIGUE", emoji: "⚡", label: "피로", desc: "기력 회복" },
] as const;

export type HealthKey = (typeof HEALTH)[number]["key"];
export type HealthCode = (typeof HEALTH)[number]["code"];

export const HEALTH_KEYS = HEALTH.map((h) => h.key) as HealthKey[];

export function codesFromUser(u: Partial<Record<HealthKey, boolean | null>> | null | undefined): HealthCode[] {
  if (!u) return [];
  return HEALTH.filter((h) => !!u[h.key]).map((h) => h.code);
}

export function parseCodes(raw: string | string[] | undefined | null): HealthCode[] {
  const s = Array.isArray(raw) ? raw.join(",") : raw || "";
  const valid = new Set<string>(HEALTH.map((h) => h.code));
  return Array.from(new Set(s.split(",").map((x) => x.trim().toUpperCase()).filter((x) => valid.has(x)))) as HealthCode[];
}

export function labelOf(code: string) {
  return HEALTH.find((h) => h.code === code)?.label ?? code;
}

export const CATEGORIES = [
  { code: "HERB", label: "산나물", emoji: "🌿", tint: "bg-forest-50" },
  { code: "ROOT", label: "뿌리·약초", emoji: "🥕", tint: "bg-clay-50" },
  { code: "MUSHROOM", label: "버섯", emoji: "🍄", tint: "bg-lilac-100" },
  { code: "FRUIT", label: "열매", emoji: "🫐", tint: "bg-butter-100" },
] as const;

export function categoryLabel(code?: string | null) {
  return CATEGORIES.find((c) => c.code === code)?.label ?? "산야초";
}

export const FORM_STATES = ["생것", "건조", "데친 것", "냉동", "절임·장아찌", "가루·분말"];
export const UNITS = ["kg", "g", "근", "단", "봉", "개", "박스"];

export const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "결제대기", tone: "bg-stone-100 text-stone-700" },
  PAID: { label: "주문확인", tone: "bg-amber-100 text-amber-800" },
  SHIPPED: { label: "배송중", tone: "bg-sky-100 text-sky-800" },
  COMPLETED: { label: "배송완료", tone: "bg-forest-100 text-forest-800" },
  CANCELLED: { label: "취소", tone: "bg-rose-100 text-rose-700" },
};
