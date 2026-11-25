import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { notify } from "@/lib/wants";
import { won } from "@/lib/format";

/** 채취자 제안 보내기/수정 (요청 1건당 채취자 1개) */
export const POST = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const me = await requireSeller();
    const requestId = Number((await params).id);
    const w = await prisma.wantRequest.findUnique({ where: { id: requestId } });
    if (!w) return fail("요청을 찾을 수 없습니다.", 404);
    if (w.buyerId === me.id) return fail("내 요청에는 제안할 수 없어요.");
    if (w.status !== "OPEN") return fail("이미 거래가 연결됐거나 마감된 요청이에요.");

    const b = await req.json();
    const price = Math.round(Number(b.price));
    const quantity = Math.round(Number(b.quantity));
    if (!(price > 0)) return fail("가격을 입력해 주세요.");
    if (!(quantity > 0)) return fail("수량을 입력해 주세요.");
    let productId: number | null = Number(b.productId) || null;
    if (productId) {
      const own = await prisma.product.findFirst({ where: { id: productId, sellerId: me.id, hidden: false } });
      if (!own) productId = null;
    }
    const data = { price, quantity, unit: String(b.unit || w.unit).slice(0, 10), message: String(b.message || "").trim().slice(0, 500) || null, productId };
    const existing = await prisma.wantOffer.findUnique({ where: { requestId_sellerId: { requestId, sellerId: me.id } } });
    if (existing?.status === "ACCEPTED") return fail("이미 수락된 제안은 바꿀 수 없어요.");
    await prisma.wantOffer.upsert({
      where: { requestId_sellerId: { requestId, sellerId: me.id } },
      update: { ...data, status: "SENT" },
      create: { ...data, requestId, sellerId: me.id },
    });
    const farm = me.sellerProfile?.farmName || me.name || "채취자";
    await notify([w.buyerId], {
      title: `📩 ${farm}님이 ‘${w.keyword}’ ${existing ? "제안을 수정했어요" : "제안을 보냈어요"}`,
      body: `${quantity}${data.unit} · ${won(price)}/${data.unit}`,
      link: `/wants/${w.id}`,
    });
    return ok({}, existing ? 200 : 201);
  });
