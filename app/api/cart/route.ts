import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";

export const GET = () =>
  handle(async () => {
    const me = await requireUser();
    const items = await prisma.cartItem.findMany({
      where: { userId: me.id },
      include: { product: { include: { images: { take: 1, orderBy: { isPrimary: "desc" } }, plant: { select: { category: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return ok({ items });
  });

export const POST = (req: Request) =>
  handle(async () => {
    const me = await requireUser();
    const { productId, quantity = 1 } = await req.json();
    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product || product.hidden) return fail("상품을 찾을 수 없습니다.", 404);
    if (product.sellerId === me.id) return fail("내가 등록한 상품은 구매할 수 없습니다.");
    const existing = await prisma.cartItem.findFirst({ where: { userId: me.id, productId: product.id } });
    const nextQty = Math.max(1, (existing?.quantity ?? 0) + Number(quantity));
    if (nextQty > product.quantity) return fail(`남은 수량은 ${product.quantity}${product.unit}입니다.`);
    if (existing) await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQty } });
    else await prisma.cartItem.create({ data: { userId: me.id, productId: product.id, quantity: nextQty } });
    return ok({}, 201);
  });

export const PATCH = (req: Request) =>
  handle(async () => {
    const me = await requireUser();
    const { id, quantity } = await req.json();
    const item = await prisma.cartItem.findFirst({ where: { id: Number(id), userId: me.id }, include: { product: true } });
    if (!item) return fail("장바구니 항목을 찾을 수 없습니다.", 404);
    const q = Math.max(1, Math.min(Number(quantity) || 1, item.product.quantity));
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: q } });
    return ok();
  });

export const DELETE = (req: Request) =>
  handle(async () => {
    const me = await requireUser();
    const id = Number(new URL(req.url).searchParams.get("id"));
    await prisma.cartItem.deleteMany({ where: { id, userId: me.id } });
    return ok();
  });
