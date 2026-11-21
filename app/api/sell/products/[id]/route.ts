import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { parseProductInput } from "@/lib/sellerInput";

type Ctx = { params: Promise<{ id: string }> };

async function own(id: number, sellerId: number) {
  return prisma.product.findFirst({ where: { id, sellerId }, include: { _count: { select: { orderItems: true } } } });
}

export const PATCH = (req: Request, { params }: Ctx) =>
  handle(async () => {
    const me = await requireSeller();
    const id = Number((await params).id);
    if (!(await own(id, me.id))) return fail("내 상품만 수정할 수 있습니다.", 404);
    const { data, images } = parseProductInput(await req.json());
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: { ...data, images: { create: images.map((url, i) => ({ url, isPrimary: i === 0 })) } },
      }),
    ]);
    return ok({ id });
  });

/** 주문 이력이 있는 상품은 삭제 대신 판매중지(수량 0) 처리해 주문 기록을 보존 */
export const DELETE = (_req: Request, { params }: Ctx) =>
  handle(async () => {
    const me = await requireSeller();
    const id = Number((await params).id);
    const p = await own(id, me.id);
    if (!p) return fail("내 상품만 삭제할 수 있습니다.", 404);
    if (p._count.orderItems > 0) {
      await prisma.product.update({ where: { id }, data: { quantity: 0 } });
      return ok({ archived: true });
    }
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    return ok({ deleted: true });
  });
