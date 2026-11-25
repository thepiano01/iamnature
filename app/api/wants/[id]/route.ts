import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";

/** 요청 마감/다시 열기 (작성자만) */
export const PATCH = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const me = await requireUser();
    const id = Number((await params).id);
    const { action } = await req.json();
    const w = await prisma.wantRequest.findFirst({ where: { id, buyerId: me.id } });
    if (!w) return fail("요청을 찾을 수 없습니다.", 404);
    if (action === "close") await prisma.wantRequest.update({ where: { id }, data: { status: "CLOSED" } });
    else if (action === "reopen") await prisma.wantRequest.update({ where: { id }, data: { status: "OPEN" } });
    else return fail("잘못된 요청입니다.");
    return ok();
  });
