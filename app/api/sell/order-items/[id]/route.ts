import { requireSeller } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { setItemStatus } from "@/lib/orders";

export const PATCH = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const me = await requireSeller();
    const { status } = await req.json();
    // sellerId는 세션에서만 결정 → 다른 판매자 주문은 수정 불가
    await setItemStatus(Number((await params).id), status, me.id);
    return ok();
  });
