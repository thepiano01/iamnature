import { prisma } from "@/lib/db";
import { getCurrentUser, requireUser, setSessionCookie, type Role } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { HEALTH } from "@/lib/health";

export const GET = () =>
  handle(async () => ok({ user: await getCurrentUser() }));

/** 내 정보 수정 — userId는 받지 않고 세션에서만 결정 */
export const PATCH = (req: Request) =>
  handle(async () => {
    const me = await requireUser();
    const b = await req.json();
    const data: Record<string, unknown> = {};

    if (Array.isArray(b.health)) {
      for (const h of HEALTH) data[h.key] = b.health.includes(h.code);
    }
    for (const k of ["name", "phone", "address1", "address2", "zip"] as const) {
      if (typeof b[k] === "string") data[k] = b[k].trim() || null;
    }
    // 구매자 → 채취자 전환
    if (b.becomeSeller && me.role === "BUYER") {
      data.role = "BOTH";
      await prisma.sellerProfile.upsert({ where: { userId: me.id }, update: {}, create: { userId: me.id, farmName: b.farmName || null } });
    }
    const user = await prisma.user.update({ where: { id: me.id }, data });
    if (data.role) await setSessionCookie({ userId: user.id, role: user.role as Role, email: user.email });
    return ok();
  });
