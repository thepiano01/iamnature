import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CATEGORIES, categoryLabel } from "@/lib/health";
import { ymd } from "@/lib/format";
import ProductArt from "@/components/ProductArt";
import { Badge, PageHead, SearchBox, Table, Tabs } from "@/components/admin/ui";

export const metadata: Metadata = { title: "식물·효능 DB" };
export const dynamic = "force-dynamic";

export default async function AdminPlants({ searchParams }: { searchParams: Promise<{ f?: string; c?: string; q?: string }> }) {
  const { f = "", c = "", q } = await searchParams;
  const where: Prisma.PlantWhereInput = {
    AND: [
      f === "nocond" ? { conditions: { none: {} } } : f === "draft" ? { status: "DRAFT" } : {},
      c ? { category: c } : {},
      q ? { OR: [{ commonName: { contains: q } }, { scientificName: { contains: q } }, { englishName: { contains: q } }] } : {},
    ],
  };
  const [total, noCond, draft, plants] = await Promise.all([
    prisma.plant.count(),
    prisma.plant.count({ where: { conditions: { none: {} } } }),
    prisma.plant.count({ where: { status: "DRAFT" } }),
    prisma.plant.findMany({
      where,
      include: {
        conditions: { include: { condition: { select: { name: true } } } },
        seasons: true,
        _count: { select: { products: true, videos: true } },
      },
      orderBy: { commonName: "asc" },
    }),
  ]);
  const extra = [q && `q=${encodeURIComponent(q)}`, c && `c=${c}`].filter(Boolean).join("&");

  return (
    <>
      <PageHead
        eyebrow="Plant DB"
        title="식물·효능 DB"
        desc="여기서 연결한 건강상태가 곧 ‘건강 매칭’ 추천 기준이 됩니다. 상품 상세 하단의 설명·조리법·주의사항도 여기서 관리해요."
        action={<Link href="/admin/plants/new" className="btn-accent btn-sm">+ 식물 추가</Link>}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          base={`/admin/plants${extra ? `?${extra}` : ""}`}
          active={f ? `f=${f}` : ""}
          tabs={[
            ["", "전체", total],
            ["f=nocond", "건강상태 미연결", noCond],
            ["f=draft", "검토 전", draft],
          ]}
        />
        <SearchBox action="/admin/plants" q={q} placeholder="이름·학명" hidden={{ f, c }} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Link href={`/admin/plants?${[f && `f=${f}`, q && `q=${q}`].filter(Boolean).join("&")}`} className={`chip ${!c ? "border-forest-800 bg-forest-800 text-white" : "border-hanji-300 bg-white text-bark-700"}`}>분류 전체</Link>
        {CATEGORIES.map((x) => (
          <Link key={x.code} href={`/admin/plants?${[f && `f=${f}`, q && `q=${q}`, `c=${x.code}`].filter(Boolean).join("&")}`} className={`chip ${c === x.code ? "border-forest-800 bg-forest-800 text-white" : "border-hanji-300 bg-white text-bark-700"}`}>
            {x.label}
          </Link>
        ))}
      </div>
      <Table head={["식물", "분류", "연결된 건강상태", "제철", "상품", "상태", "수정일"]}>
        {plants.map((p) => (
          <tr key={p.id} className="hover:bg-hanji-50">
            <td className="px-4 py-3">
              <Link href={`/admin/plants/${p.id}`} className="flex items-center gap-3">
                <ProductArt category={p.category} className="h-10 w-10 shrink-0 rounded-lg" />
                <span>
                  <span className="font-semibold hover:underline">{p.commonName}</span>
                  {p.isProtected && <Badge tone="rose">보호종</Badge>}
                  <span className="block text-xs italic text-bark-400">{p.scientificName}</span>
                </span>
              </Link>
            </td>
            <td className="px-4 py-3 text-xs">{categoryLabel(p.category)}</td>
            <td className="px-4 py-3">
              {p.conditions.length ? (
                <div className="flex flex-wrap gap-1">
                  {p.conditions.map((pc) => (
                    <span key={pc.id} className="rounded-md bg-forest-50 px-1.5 py-0.5 text-[10px] font-medium text-forest-800">{pc.condition.name}</span>
                  ))}
                </div>
              ) : (
                <span className="text-xs font-semibold text-clay-600">미연결</span>
              )}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-xs text-bark-500">{p.seasons.map((s) => `${s.startMonth}~${s.endMonth}월`).join(", ") || "-"}</td>
            <td className="px-4 py-3">{p._count.products}</td>
            <td className="px-4 py-3">{p.status === "REVIEWED" ? <Badge tone="green">검토 완료</Badge> : <Badge tone="amber">검토 전</Badge>}</td>
            <td className="whitespace-nowrap px-4 py-3 text-xs text-bark-500">{ymd(p.updatedAt)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
