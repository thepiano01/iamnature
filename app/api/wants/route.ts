import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { findTargetSellers, notify } from "@/lib/wants";
import { won } from "@/lib/format";

/** 구해요 등록 → 맞는 채취자들에게 알림 */
export const POST = (req: Request) =>
  handle(async () => {
    const me = await requireUser();
    const b = await req.json();
    const plantId = Number(b.plantId) || null;
    const plant = plantId ? await prisma.plant.findUnique({ where: { id: plantId }, select: { commonName: true } }) : null;
    const keyword = String(b.keyword || plant?.commonName || "").trim().slice(0, 40);
    if (!keyword) return fail("어떤 품목을 찾는지 적어주세요.");
    const quantity = Math.max(1, Math.round(Number(b.quantity) || 1));
    const budget = Number(b.budget) > 0 ? Math.round(Number(b.budget)) : null;
    const neededBy = b.neededBy ? new Date(String(b.neededBy)) : null;

    // 같은 사람이 같은 품목을 짧은 시간에 반복 등록하는 것 방지
    const dup = await prisma.wantRequest.findFirst({ where: { buyerId: me.id, keyword, status: "OPEN", createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } } });
    if (dup) return ok({ id: dup.id, sent: 0, duplicate: true });

    const w = await prisma.wantRequest.create({
      data: {
        buyerId: me.id,
        plantId,
        keyword,
        quantity,
        unit: String(b.unit || "kg").slice(0, 10),
        budget,
        neededBy: neededBy && !isNaN(+neededBy) ? neededBy : null,
        region: String(b.region || "").trim().slice(0, 40) || null,
        note: String(b.note || "").trim().slice(0, 500) || null,
      },
    });

    const targets = await findTargetSellers({ plantId, keyword, buyerId: me.id });
    if (targets.length) {
      await prisma.wantTarget.createMany({ data: targets.map((t) => ({ requestId: w.id, sellerId: t.sellerId, reason: t.reason })) });
      const summary = `${w.quantity}${w.unit}${budget ? ` · 희망 ${won(budget)}/${w.unit}` : ""}${w.region ? ` · ${w.region}` : ""}`;
      for (const reason of ["SOLD", "LISTING", "CATEGORY"]) {
        const ids = targets.filter((t) => t.reason === reason).map((t) => t.sellerId);
        await notify(ids, {
          title: reason === "SOLD" ? `🔔 예전에 파셨던 ‘${keyword}’을(를) 찾는 분이 있어요` : `🔔 ‘${keyword}’ 구해요 요청이 왔어요`,
          body: summary,
          link: `/wants/${w.id}`,
        });
      }
    }
    return ok({ id: w.id, sent: targets.length }, 201);
  });
