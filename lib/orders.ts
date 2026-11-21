import "server-only";
import { prisma } from "./db";
import { HttpError } from "./auth";

export const ITEM_FLOW = ["PAID", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

/**
 * 주문 상품 상태 변경 (판매자/관리자 공용)
 * - sellerId를 주면 그 판매자의 항목만 변경 가능
 * - 취소 시 재고 복구, 주문 전체 상태 자동 갱신
 */
export async function setItemStatus(itemId: number, status: string, sellerId?: number) {
  if (!ITEM_FLOW.includes(status as never)) throw new HttpError(400, "잘못된 상태값입니다.");
  const item = await prisma.orderItem.findFirst({ where: { id: itemId, ...(sellerId ? { sellerId } : {}) } });
  if (!item) throw new HttpError(404, "주문을 찾을 수 없습니다.");

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.update({ where: { id: itemId }, data: { sellerStatus: status } });
    if (status === "CANCELLED" && item.sellerStatus !== "CANCELLED") {
      await tx.product.update({ where: { id: item.productId }, data: { quantity: { increment: item.quantity } } });
    }
    if (item.sellerStatus === "CANCELLED" && status !== "CANCELLED") {
      await tx.product.update({ where: { id: item.productId }, data: { quantity: { decrement: item.quantity } } });
    }
    // 주문 전체 상태 = 취소되지 않은 항목 중 가장 덜 진행된 단계
    const siblings = await tx.orderItem.findMany({ where: { orderId: item.orderId }, select: { sellerStatus: true } });
    const active = siblings.map((s) => s.sellerStatus).filter((s) => s !== "CANCELLED");
    const orderStatus = !active.length ? "CANCELLED" : ITEM_FLOW[Math.min(...active.map((s) => Math.max(0, ITEM_FLOW.indexOf(s as never))))];
    await tx.order.update({ where: { id: item.orderId }, data: { status: orderStatus } });
  });
}
