import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHead } from "@/components/admin/ui";
import PlantForm from "../PlantForm";

export const metadata: Metadata = { title: "식물 수정" };
export const dynamic = "force-dynamic";

export default async function EditPlant({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const p = await prisma.plant.findUnique({
    where: { id },
    include: { conditions: { include: { condition: true } }, seasons: true, videos: true, _count: { select: { products: true } } },
  });
  if (!p) notFound();
  const s = (x: string | null) => x ?? "";
  return (
    <>
      <Link href="/admin/plants" className="text-xs text-bark-400 hover:text-bark-700">← 식물·효능 DB</Link>
      <PageHead eyebrow="Edit plant" title={p.commonName} desc={p.scientificName ?? undefined} />
      <PlantForm
        productCount={p._count.products}
        initial={{
          id: p.id,
          commonName: p.commonName,
          scientificName: s(p.scientificName),
          englishName: s(p.englishName),
          category: s(p.category) || "HERB",
          family: s(p.family),
          status: p.status,
          isProtected: p.isProtected,
          generalDescription: s(p.generalDescription),
          folkUsageSummary: s(p.folkUsageSummary),
          effectsDetail: s(p.effectsDetail),
          healthyCookingTips: s(p.healthyCookingTips),
          cautionsDetail: s(p.cautionsDetail),
          toxicitySummary: s(p.toxicitySummary),
          conditions: p.conditions.map((c) => ({ code: c.condition.code, evidenceLevel: s(c.evidenceLevel) || "folk", efficacySummary: s(c.efficacySummary), usageNote: s(c.usageNote) })),
          seasons: p.seasons.map((x) => ({ startMonth: x.startMonth, endMonth: x.endMonth })),
          videos: p.videos.map((x) => ({ title: x.title, url: x.url })),
        }}
      />
    </>
  );
}
