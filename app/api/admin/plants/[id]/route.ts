import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { savePlant } from "@/lib/plantInput";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = (req: Request, { params }: Ctx) =>
  handle(async () => {
    await requireAdmin();
    const p = await savePlant(Number((await params).id), await req.json());
    return ok({ id: p.id });
  });

export const DELETE = (_req: Request, { params }: Ctx) =>
  handle(async () => {
    await requireAdmin();
    const id = Number((await params).id);
    const used = await prisma.product.count({ where: { plantId: id } });
    if (used) return fail(`이 식물로 등록된 상품이 ${used}개 있어 삭제할 수 없습니다.`);
    await prisma.$transaction([
      prisma.plantCondition.deleteMany({ where: { plantId: id } }),
      prisma.seasonality.deleteMany({ where: { plantId: id } }),
      prisma.plantVideo.deleteMany({ where: { plantId: id } }),
      prisma.preparationMethod.deleteMany({ where: { plantId: id } }),
      prisma.plantSafety.deleteMany({ where: { plantId: id } }),
      prisma.plantPart.deleteMany({ where: { plantId: id } }),
      prisma.plantRegion.deleteMany({ where: { plantId: id } }),
      prisma.regulationInfo.deleteMany({ where: { plantId: id } }),
      prisma.plantSource.deleteMany({ where: { plantId: id } }),
      prisma.plantTag.deleteMany({ where: { plantId: id } }),
      prisma.plant.delete({ where: { id } }),
    ]);
    return ok();
  });
