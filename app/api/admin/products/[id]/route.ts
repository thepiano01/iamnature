import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

/** 상품 숨김/노출 */
export const PATCH = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    await requireAdmin();
    const id = Number((await params).id);
    const { hidden } = await req.json();
    await prisma.product.update({ where: { id }, data: { hidden: !!hidden } });
    return ok();
  });
