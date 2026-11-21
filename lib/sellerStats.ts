import "server-only";
import { prisma } from "./db";
import { summarize, trustTemp } from "./reviews";

/** 채취자 한 명의 신뢰 온도·거래 수·후기 요약 */
export async function sellerStats(sellerId: number) {
  const [reviews, completed] = await Promise.all([
    prisma.review.findMany({ where: { sellerId, hidden: false }, select: { rating: true, tags: true } }),
    prisma.orderItem.count({ where: { sellerId, sellerStatus: "COMPLETED" } }),
  ]);
  return { temp: trustTemp(reviews.map((r) => r.rating), completed), completed, ...summarize(reviews) };
}
