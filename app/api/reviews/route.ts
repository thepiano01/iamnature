import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { parseTags } from "@/lib/reviews";
import { setItemStatus } from "@/lib/orders";

/** 후기 작성 — 본인이 산 주문 상품 중 배송완료(또는 배송중)인 것만, 1건당 1번 */
export const POST = (req: Request) =>
  handle(async () => {
    const me = await requireUser();
    const b = await req.json();
    const orderItemId = Number(b.orderItemId);
    const rating = Math.round(Number(b.rating));
    if (!(rating >= 1 && rating <= 5)) return fail("별점을 골라주세요.");
    const content = String(b.content || "").trim().slice(0, 1000);
    const tags = parseTags(Array.isArray(b.tags) ? b.tags.join(",") : String(b.tags || "")).slice(0, 6);
    const photos = (Array.isArray(b.photos) ? b.photos : [])
      .map(String)
      .filter((u: string) => u.startsWith("/uploads/") || u.startsWith("https://"))
      .slice(0, 5);
    if (!content && !tags.length) return fail("칭찬 태그를 고르거나 후기를 적어주세요.");

    const item = await prisma.orderItem.findFirst({
      where: { id: orderItemId, order: { buyerId: me.id } },
      include: { review: true, product: { select: { sellerId: true } } },
    });
    if (!item) return fail("주문을 찾을 수 없습니다.", 404);
    if (item.review) return fail("이미 후기를 작성했어요.", 409);
    if (!["SHIPPED", "COMPLETED"].includes(item.sellerStatus)) return fail("상품을 받은 뒤에 후기를 쓸 수 있어요.");

    const sellerId = item.sellerId ?? item.product.sellerId;
    if (!sellerId) return fail("채취자 정보가 없는 상품이에요.");
    await prisma.review.create({
      data: { orderItemId, productId: item.productId, buyerId: me.id, sellerId, rating, tags: tags.join(","), content: content || null, photos: photos.join(",") },
    });
    // 후기를 쓰면 수령 확인으로 보고 배송완료 처리 (주문 전체 상태도 함께 갱신)
    if (item.sellerStatus === "SHIPPED") await setItemStatus(item.id, "COMPLETED");
    return ok({}, 201);
  });
