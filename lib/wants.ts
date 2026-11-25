import "server-only";
import { prisma } from "./db";

export const WANT_REASON: Record<string, { label: string; tone: string }> = {
  SOLD: { label: "판매 이력 있음", tone: "bg-clay-100 text-clay-700" },
  LISTING: { label: "지금 판매 중", tone: "bg-forest-100 text-forest-800" },
  CATEGORY: { label: "비슷한 품목 채취", tone: "bg-lilac-100 text-lilac-500" },
};

export const WANT_STATUS: Record<string, { label: string; tone: string }> = {
  OPEN: { label: "찾는 중", tone: "bg-butter-100 text-bark-900" },
  MATCHED: { label: "거래 연결됨", tone: "bg-forest-100 text-forest-800" },
  CLOSED: { label: "마감", tone: "bg-hanji-200 text-bark-500" },
};

const MAX_TARGETS = 40;

/**
 * 구해요 요청을 받을 채취자 찾기 (우선순위 순)
 * 1) SOLD     — 이 품목을 실제로 판 적 있는 채취자 (주문 이력)
 * 2) LISTING  — 이 품목을 지금 판매 중이거나 등록한 적 있는 채취자
 * 3) CATEGORY — 위 둘이 없을 때만: 같은 분류(산나물·뿌리·버섯·열매)를 다루는 채취자
 * 요청한 본인과 이용정지 회원은 제외
 */
export async function findTargetSellers(opts: { plantId: number | null; keyword: string; buyerId: number }) {
  const kw = opts.keyword.trim();
  const productMatch = {
    OR: [
      ...(opts.plantId ? [{ plantId: opts.plantId }] : []),
      ...(kw ? [{ title: { contains: kw } }, { plantName: { contains: kw } }, { plant: { commonName: { contains: kw } } }] : []),
    ],
  };
  const okSeller = { role: { in: ["SELLER", "BOTH"] }, suspended: false, id: { not: opts.buyerId } };

  const [sold, listed] = await Promise.all([
    prisma.orderItem.findMany({
      where: { sellerStatus: { in: ["PAID", "SHIPPED", "COMPLETED"] }, product: productMatch, sellerId: { not: null } },
      select: { sellerId: true },
      distinct: ["sellerId"],
    }),
    prisma.product.findMany({ where: { ...productMatch, seller: okSeller }, select: { sellerId: true }, distinct: ["sellerId"] }),
  ]);

  const out = new Map<number, string>();
  const okIds = new Set(
    (await prisma.user.findMany({ where: { ...okSeller, id: { in: sold.map((s) => s.sellerId!).filter(Boolean) } }, select: { id: true } })).map((u) => u.id),
  );
  for (const s of sold) if (s.sellerId && okIds.has(s.sellerId)) out.set(s.sellerId, "SOLD");
  for (const s of listed) if (s.sellerId && !out.has(s.sellerId)) out.set(s.sellerId, "LISTING");

  if (!out.size) {
    // 같은 분류 채취자에게라도 전달
    const plant = opts.plantId
      ? await prisma.plant.findUnique({ where: { id: opts.plantId }, select: { category: true } })
      : await prisma.plant.findFirst({ where: { commonName: { contains: kw } }, select: { category: true } });
    const category = plant?.category ?? guessCategory(kw);
    if (category) {
      const same = await prisma.product.findMany({ where: { plant: { category }, seller: okSeller }, select: { sellerId: true }, distinct: ["sellerId"] });
      for (const s of same) if (s.sellerId) out.set(s.sellerId, "CATEGORY");
    }
  }
  return Array.from(out, ([sellerId, reason]) => ({ sellerId, reason })).slice(0, MAX_TARGETS);
}

/** 식물 DB에 없는 품목도 이름으로 대략 분류 */
function guessCategory(kw: string) {
  if (/버섯|송이|능이|표고|영지|목이|느타리|싸리|꽃송이/.test(kw)) return "MUSHROOM";
  if (/뿌리|도라지|더덕|칡|우슬|삼|황기|당귀|천마|둥굴레/.test(kw)) return "ROOT";
  if (/열매|오미자|머루|다래|산딸기|복분자|구기자|산수유|개복숭아/.test(kw)) return "FRUIT";
  if (/나물|취|두릅|고사리|명이|산마늘|돌나물|곰취|참나물|냉이|달래/.test(kw)) return "HERB";
  return null;
}

/** 사이트 안 알림 보내기 */
export async function notify(userIds: number[], n: { title: string; body?: string; link?: string }) {
  const ids = Array.from(new Set(userIds)).filter(Boolean);
  if (!ids.length) return;
  await prisma.notification.createMany({ data: ids.map((userId) => ({ userId, title: n.title, body: n.body ?? null, link: n.link ?? null })) });
}
