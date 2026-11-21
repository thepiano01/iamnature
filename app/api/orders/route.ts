import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";

/** 장바구니 → 주문 생성 (재고 차감 포함, 트랜잭션) */
export const POST = (req: Request) =>
  handle(async () => {
    const me = await requireUser();
    const b = await req.json();
    const shippingName = String(b.shippingName || "").trim();
    const shippingPhone = String(b.shippingPhone || "").trim();
    const shippingAddress1 = String(b.shippingAddress1 || "").trim();
    if (!shippingName || !shippingPhone || !shippingAddress1) return fail("받는 분, 연락처, 주소를 입력해 주세요.");

    const cart = await prisma.cartItem.findMany({ where: { userId: me.id }, include: { product: true } });
    if (!cart.length) return fail("장바구니가 비어 있습니다.");
    for (const c of cart) {
      if (c.quantity > c.product.quantity) return fail(`‘${c.product.title}’ 재고가 부족합니다. (남은 수량 ${c.product.quantity}${c.product.unit})`);
    }

    const total = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          buyerId: me.id,
          status: "PAID", // 결제 연동 전: 주문 즉시 '주문확인' 처리
          totalPrice: total,
          shippingName,
          shippingPhone,
          shippingAddress1,
          shippingAddress2: String(b.shippingAddress2 || "").trim() || null,
          shippingZip: String(b.shippingZip || "").trim() || null,
          requestMessage: String(b.requestMessage || "").trim() || null,
          items: {
            create: cart.map((c) => ({
              productId: c.productId,
              sellerId: c.product.sellerId,
              productTitle: c.product.title,
              unitPrice: c.product.price,
              quantity: c.quantity,
              subtotal: c.product.price * c.quantity,
              sellerStatus: "PAID",
            })),
          },
        },
      });
      for (const c of cart) {
        await tx.product.update({ where: { id: c.productId }, data: { quantity: { decrement: c.quantity } } });
      }
      await tx.cartItem.deleteMany({ where: { userId: me.id } });
      if (b.saveAddress) {
        await tx.user.update({
          where: { id: me.id },
          data: { phone: shippingPhone, address1: shippingAddress1, address2: b.shippingAddress2 || null, zip: b.shippingZip || null },
        });
      }
      return o;
    });
    return ok({ orderId: order.id }, 201);
  });
