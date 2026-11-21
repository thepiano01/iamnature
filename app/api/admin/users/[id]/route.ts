import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";

const ROLES = ["BUYER", "SELLER", "BOTH", "ADMIN"];

/** 회원 역할 변경·이용정지 */
export const PATCH = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const me = await requireAdmin();
    const id = Number((await params).id);
    if (id === me.id) return fail("내 계정은 여기서 바꿀 수 없습니다.");
    const b = await req.json();
    const data: { role?: string; suspended?: boolean } = {};
    if (b.role !== undefined) {
      if (!ROLES.includes(b.role)) return fail("잘못된 역할입니다.");
      data.role = b.role;
      if (b.role === "SELLER" || b.role === "BOTH") {
        await prisma.sellerProfile.upsert({ where: { userId: id }, update: {}, create: { userId: id } });
      }
    }
    if (typeof b.suspended === "boolean") data.suspended = b.suspended;
    await prisma.user.update({ where: { id }, data });
    return ok();
  });
