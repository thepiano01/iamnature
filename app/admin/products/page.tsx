import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { categoryLabel } from "@/lib/health";
import { won, ymd } from "@/lib/format";
import ActionButton from "@/components/admin/ActionButton";
import ProductArt from "@/components/ProductArt";
import { Badge, PageHead, SearchBox, Table, Tabs } from "@/components/admin/ui";

export const metadata: Metadata = { title: "상품 관리" };
export const dynamic = "force-dynamic";

const F: Record<string, Prisma.ProductWhereInput> = {
  live: { hidden: false, quantity: { gt: 0 } },
  soldout: { quantity: 0 },
  hidden: { hidden: true },
  noplant: { plantId: null },
};

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ f?: string; q?: string }> }) {
  const { f = "", q } = await searchParams;
  const where: Prisma.ProductWhereInput = {
    AND: [
      F[f] ?? {},
      q ? { OR: [{ title: { contains: q } }, { plantName: { contains: q } }, { region: { contains: q } }, { seller: { name: { contains: q } } }, { seller: { sellerProfile: { farmName: { contains: q } } } }] } : {},
    ],
  };
  const [total, counts, list] = await Promise.all([
    prisma.product.count(),
    Promise.all(Object.values(F).map((w) => prisma.product.count({ where: w }))),
    prisma.product.findMany({
      where,
      include: {
        images: { take: 1, orderBy: { isPrimary: "desc" } },
        plant: { select: { commonName: true, category: true, _count: { select: { conditions: true } } } },
        seller: { select: { name: true, sellerProfile: { select: { farmName: true, verified: true } } } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <>
      <PageHead eyebrow="Products" title="상품 관리" desc="문제가 있는 상품은 숨기면 쇼핑몰·검색·추천에서 즉시 빠집니다. (채취자 화면에는 남아요)" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          base={`/admin/products${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          active={f ? `f=${f}` : ""}
          tabs={[
            ["", "전체", total],
            ["f=live", "판매 중", counts[0]],
            ["f=soldout", "품절·중지", counts[1]],
            ["f=hidden", "숨김", counts[2]],
            ["f=noplant", "식물 미지정", counts[3]],
          ]}
        />
        <SearchBox action="/admin/products" q={q} placeholder="상품명·식물·산지·채취자" hidden={{ f }} />
      </div>
      <Table head={["상품", "채취자", "식물·매칭", "가격", "재고", "주문", "등록일", "관리"]}>
        {list.map((p) => {
          const img = p.images[0]?.url || p.imageUrl;
          return (
            <tr key={p.id} className={p.hidden ? "bg-stone-50 opacity-70" : ""}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <ProductArt category={p.plant?.category} className="h-full w-full" />}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/products/${p.id}`} className="line-clamp-1 font-semibold hover:underline">{p.title}</Link>
                    <p className="text-xs text-bark-400">{p.region || "-"} · {p.formState}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-xs">
                {p.seller?.sellerProfile?.farmName || p.seller?.name}
                {p.seller?.sellerProfile?.verified && <span className="text-forest-700"> ✓</span>}
              </td>
              <td className="px-4 py-3 text-xs">
                {p.plant ? (
                  <>
                    {p.plant.commonName} <span className="text-bark-400">({categoryLabel(p.plant.category)})</span>
                    <br />
                    {p.plant._count.conditions ? <span className="text-forest-700">건강 {p.plant._count.conditions}개 연결</span> : <span className="text-clay-600">효능 미연결</span>}
                  </>
                ) : (
                  <span className="text-clay-600">{p.plantName || "미지정"} · 매칭 안 됨</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3">{won(p.price)}<span className="text-xs text-bark-400">/{p.unit}</span></td>
              <td className="px-4 py-3">{p.quantity === 0 ? <Badge tone="rose">품절</Badge> : `${p.quantity}${p.unit}`}</td>
              <td className="px-4 py-3">{p._count.orderItems}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-bark-500">{ymd(p.createdAt)}</td>
              <td className="px-4 py-3">
                {p.hidden ? (
                  <ActionButton url={`/api/admin/products/${p.id}`} body={{ hidden: false }} label="다시 노출" />
                ) : (
                  <ActionButton url={`/api/admin/products/${p.id}`} body={{ hidden: true }} label="숨기기" className="btn-sm rounded-full px-3 text-xs text-bark-400 hover:text-rose-600" confirm={`‘${p.title}’을(를) 쇼핑몰에서 숨길까요?`} />
                )}
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
