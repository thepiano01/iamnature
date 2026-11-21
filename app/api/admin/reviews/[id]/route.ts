import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

/** 후기 숨김/노출 */
export const PATCH = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    await requireAdmin();
    const { hidden } = await req.json();
    await prisma.review.update({ where: { id: Number((await params).id) }, data: { hidden: !!hidden } });
    return ok();
  });
