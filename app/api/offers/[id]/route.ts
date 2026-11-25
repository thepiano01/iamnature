import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { notify } from "@/lib/wants";

/**
 * 제안 처리
 * - 구매자(요청 작성자): accept / decline
 * - 채취자(제안 작성자): attach — 수락된 제안에 판매 상품 연결 → 구매자가 바로 구매
 */
export const PATCH = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const me = await requireUser();
    const id = Number((await params).id);
    const b = await req.json();
    const offer = await prisma.wantOffer.findUnique({ where: { id }, include: { request: true, seller: { select: { name: true, sellerProfile: { select: { farmName: true } } } } } });
    if (!offer) return fail("제안을 찾을 수 없습니다.", 404);
    const w = offer.request;

    if (b.action === "accept" || b.action === "decline") {
      if (w.buyerId !== me.id) return fail("내 요청의 제안만 처리할 수 있어요.", 403);
      if (b.action === "accept") {
        await prisma.$transaction([
          prisma.wantOffer.update({ where: { id }, data: { status: "ACCEPTED" } }),
          prisma.wantRequest.update({ where: { id: w.id }, data: { status: "MATCHED" } }),
        ]);
        await notify([offer.sellerId], {
          title: `🎉 ‘${w.keyword}’ 제안이 수락됐어요`,
          body: offer.productId ? "구매자가 곧 주문할 거예요." : "판매 상품을 연결해 주시면 구매자가 바로 주문할 수 있어요.",
          link: `/wants/${w.id}`,
        });
      } else {
        await prisma.wantOffer.update({ where: { id }, data: { status: "DECLINED" } });
      }
      return ok();
    }

    if (b.action === "attach") {
      if (offer.sellerId !== me.id) return fail("내 제안만 수정할 수 있어요.", 403);
      const product = await prisma.product.findFirst({ where: { id: Number(b.productId), sellerId: me.id, hidden: false } });
      if (!product) return fail("내 판매 상품을 골라주세요.");
      await prisma.wantOffer.update({ where: { id }, data: { productId: product.id } });
      const farm = offer.seller.sellerProfile?.farmName || offer.seller.name || "채취자";
      await notify([w.buyerId], { title: `🛒 ${farm}님이 ‘${w.keyword}’ 상품을 올렸어요`, body: "지금 바로 주문할 수 있어요.", link: `/products/${product.id}` });
      return ok();
    }
    return fail("잘못된 요청입니다.");
  });
