import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";

/** 채취자 인증 승인/반려/취소 */
export const PATCH = (req: Request, { params }: { params: Promise<{ userId: string }> }) =>
  handle(async () => {
    await requireAdmin();
    const userId = Number((await params).userId);
    const { action, reason } = await req.json();
    const sp = await prisma.sellerProfile.findUnique({ where: { userId } });
    if (!sp) return fail("채취자 정보를 찾을 수 없습니다.", 404);

    if (action === "approve") {
      await prisma.sellerProfile.update({ where: { userId }, data: { verified: true, rejectReason: null, reviewedAt: new Date() } });
    } else if (action === "reject") {
      const r = String(reason || "").trim();
      if (!r) return fail("반려 사유를 입력해 주세요.");
      await prisma.sellerProfile.update({ where: { userId }, data: { verified: false, rejectReason: r, reviewedAt: new Date() } });
    } else if (action === "revoke") {
      await prisma.sellerProfile.update({ where: { userId }, data: { verified: false, reviewedAt: new Date() } });
    } else return fail("잘못된 요청입니다.");
    return ok();
  });
