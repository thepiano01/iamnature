import "server-only";
import { prisma } from "./db";
import { HttpError } from "./auth";

export type PlantPayload = {
  commonName: string;
  scientificName?: string;
  englishName?: string;
  category?: string;
  family?: string;
  status?: string;
  generalDescription?: string;
  folkUsageSummary?: string;
  effectsDetail?: string;
  healthyCookingTips?: string;
  cautionsDetail?: string;
  toxicitySummary?: string;
  isProtected?: boolean;
  conditions?: { code: string; evidenceLevel?: string; efficacySummary?: string; usageNote?: string }[];
  seasons?: { startMonth: number; endMonth: number }[];
  videos?: { title: string; url: string }[];
};

const t = (v: unknown) => (typeof v === "string" ? v.trim() || null : null);

/** 식물 정보 + 건강상태 연결 + 제철 + 영상을 통째로 저장 */
export async function savePlant(id: number | null, b: PlantPayload) {
  const commonName = String(b.commonName || "").trim();
  if (!commonName) throw new HttpError(400, "식물 이름을 입력해 주세요.");
  const dup = await prisma.plant.findUnique({ where: { commonName } });
  if (dup && dup.id !== id) throw new HttpError(409, "같은 이름의 식물이 이미 있습니다.");

  const data = {
    commonName,
    scientificName: t(b.scientificName),
    englishName: t(b.englishName),
    category: t(b.category),
    family: t(b.family),
    status: b.status === "REVIEWED" ? "REVIEWED" : "DRAFT",
    generalDescription: t(b.generalDescription),
    folkUsageSummary: t(b.folkUsageSummary),
    effectsDetail: t(b.effectsDetail),
    healthyCookingTips: t(b.healthyCookingTips),
    cautionsDetail: t(b.cautionsDetail),
    toxicitySummary: t(b.toxicitySummary),
    isProtected: !!b.isProtected,
  };

  const conds = await prisma.condition.findMany();
  const condId = Object.fromEntries(conds.map((c) => [c.code, c.id]));

  return prisma.$transaction(async (tx) => {
    const plant = id ? await tx.plant.update({ where: { id }, data }) : await tx.plant.create({ data });
    if (b.conditions) {
      await tx.plantCondition.deleteMany({ where: { plantId: plant.id } });
      for (const c of b.conditions) {
        if (!condId[c.code]) continue;
        const ev = ["folk", "study", "extract", "mixed"].includes(String(c.evidenceLevel)) ? String(c.evidenceLevel) : "folk";
        await tx.plantCondition.create({
          data: {
            plantId: plant.id,
            conditionId: condId[c.code],
            evidenceLevel: ev,
            efficacySummary: t(c.efficacySummary),
            usageNote: t(c.usageNote),
            confidenceScore: ev === "study" ? 3 : ev === "mixed" || ev === "extract" ? 2 : 1,
          },
        });
      }
    }
    if (b.seasons) {
      await tx.seasonality.deleteMany({ where: { plantId: plant.id } });
      for (const s of b.seasons) {
        const a = Number(s.startMonth), z = Number(s.endMonth);
        if (a >= 1 && a <= 12 && z >= 1 && z <= 12) await tx.seasonality.create({ data: { plantId: plant.id, startMonth: a, endMonth: z } });
      }
    }
    if (b.videos) {
      await tx.plantVideo.deleteMany({ where: { plantId: plant.id } });
      for (const v of b.videos) {
        if (t(v.url) && t(v.title)) await tx.plantVideo.create({ data: { plantId: plant.id, title: v.title.trim(), url: v.url.trim() } });
      }
    }
    return plant;
  });
}
