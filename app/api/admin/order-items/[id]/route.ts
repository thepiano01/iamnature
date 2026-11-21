import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { setItemStatus } from "@/lib/orders";

/** 관리자: 모든 주문 상품 상태 변경 가능 */
export const PATCH = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    await requireAdmin();
    const { status } = await req.json();
    await setItemStatus(Number((await params).id), status);
    return ok();
  });
