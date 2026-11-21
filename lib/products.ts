import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type { HealthCode } from "./health";

/** 카드 렌더링에 필요한 필드만 */
export const cardInclude = {
  images: { orderBy: [{ isPrimary: "desc" }, { id: "asc" }] },
  plant: {
    select: {
      id: true,
      commonName: true,
      category: true,
      conditions: { select: { condition: { select: { code: true, name: true } } } },
    },
  },
  seller: { select: { id: true, name: true, sellerProfile: { select: { farmName: true, verified: true } } } },
  reviews: { where: { hidden: false }, select: { rating: true } },
} satisfies Prisma.ProductInclude;

export type CardProduct = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export type ProductFilter = {
  q?: string;
  category?: string;
  codes?: HealthCode[];
  region?: string;
  sort?: "new" | "harvest" | "price_asc" | "price_desc";
  take?: number;
};

export async function listProducts(f: ProductFilter = {}) {
  const and: Prisma.ProductWhereInput[] = [{ quantity: { gt: 0 } }, { hidden: false }];
  if (f.q) {
    const q = f.q.trim();
    and.push({
      OR: [
        { title: { contains: q } },
        { plantName: { contains: q } },
        { region: { contains: q } },
        { description: { contains: q } },
        { plant: { commonName: { contains: q } } },
        { plant: { conditions: { some: { condition: { name: { contains: q } } } } } },
      ],
    });
  }
  if (f.category) and.push({ plant: { category: f.category } });
  if (f.region) and.push({ region: { contains: f.region } });
  if (f.codes?.length) and.push({ plant: { conditions: { some: { condition: { code: { in: f.codes } } } } } });

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    f.sort === "price_asc"
      ? { price: "asc" }
      : f.sort === "price_desc"
        ? { price: "desc" }
        : f.sort === "harvest"
          ? { harvestDate: "desc" }
          : { createdAt: "desc" };

  return prisma.product.findMany({
    where: { AND: and },
    include: cardInclude,
    orderBy,
    take: f.take ?? 60,
  });
}

/**
 * 건강상태 매칭: 선택한 건강상태와 겹치는 개수가 많은 상품을 우선.
 * 각 상품에 matched(겹치는 건강상태 코드 목록)를 붙여 반환합니다.
 */
export async function recommend(codes: HealthCode[], take = 24) {
  if (!codes.length) return [];
  const list = await listProducts({ codes, take: 200 });
  return list
    .map((p) => {
      const plantCodes = p.plant?.conditions.map((c) => c.condition.code) ?? [];
      const matched = codes.filter((c) => plantCodes.includes(c));
      return { ...p, matched };
    })
    .sort((a, b) => b.matched.length - a.matched.length || +b.createdAt - +a.createdAt)
    .slice(0, take);
}

export function primaryImage(p: { images?: { url: string }[]; imageUrl?: string | null }) {
  return p.images?.[0]?.url || p.imageUrl || null;
}
