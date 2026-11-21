import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";

export const POST = (req: Request) =>
  handle(async () => {
    const me = await requireSeller();
    const b = await req.json();
    const permitImage = String(b.permitImage || "") || null;
    const idCardImage = String(b.idCardImage || "") || null;
    if (!permitImage && !idCardImage) return fail("서류 이미지를 올려주세요.");
    await prisma.sellerProfile.upsert({
      where: { userId: me.id },
      update: {
        rejectReason: null, // 재제출 시 반려 사유 초기화
        reviewedAt: null,
        ...(permitImage ? { permitImage } : {}),
        ...(idCardImage ? { idCardImage } : {}),
        farmName: typeof b.farmName === "string" ? b.farmName.trim() || null : undefined,
        businessNumber: typeof b.businessNumber === "string" ? b.businessNumber.trim() || null : undefined,
      },
      create: { userId: me.id, permitImage, idCardImage, farmName: b.farmName || null, businessNumber: b.businessNumber || null },
    });
    return ok();
  });
