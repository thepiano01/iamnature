import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

/** 알림 읽음 처리: { id } 하나 또는 { all: true } 전부 */
export const POST = (req: Request) =>
  handle(async () => {
    const me = await requireUser();
    const b = await req.json().catch(() => ({}));
    await prisma.notification.updateMany({
      where: { userId: me.id, readAt: null, ...(b.all ? {} : { id: Number(b.id) || -1 }) },
      data: { readAt: new Date() },
    });
    return ok();
  });
