import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parsePhotos, parseTags } from "@/lib/reviews";
import { ymd } from "@/lib/format";
import ActionButton from "@/components/admin/ActionButton";
import { Badge, PageHead, SearchBox, Tabs } from "@/components/admin/ui";
import { Stars } from "@/components/TrustTemp";
import { EmptyState } from "@/components/ProductCard";

export const metadata: Metadata = { title: "후기 관리" };
export const dynamic = "force-dynamic";

const F: Record<string, Prisma.ReviewWhereInput> = { low: { rating: { lte: 2 } }, hidden: { hidden: true }, photo: { photos: { not: "" } } };

export default async function AdminReviews({ searchParams }: { searchParams: Promise<{ f?: string; q?: string }> }) {
  const { f = "", q } = await searchParams;
  const where: Prisma.ReviewWhereInput = {
    AND: [F[f] ?? {}, q ? { OR: [{ content: { contains: q } }, { product: { title: { contains: q } } }, { buyer: { name: { contains: q } } }, { seller: { sellerProfile: { farmName: { contains: q } } } }] } : {}],
  };
  const [total, counts, list] = await Promise.all([
    prisma.review.count(),
    Promise.all(Object.values(F).map((w) => prisma.review.count({ where: w }))),
    prisma.review.findMany({
      where,
      include: { buyer: { select: { name: true, email: true } }, seller: { select: { name: true, sellerProfile: { select: { farmName: true } } } }, product: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <>
      <PageHead eyebrow="Reviews" title="후기 관리" desc="욕설·광고·허위 후기는 숨기면 상품·채취자 화면과 신뢰 온도 계산에서 빠집니다." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          base={`/admin/reviews${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          active={f ? `f=${f}` : ""}
          tabs={[["", "전체", total], ["f=low", "낮은 별점(1~2)", counts[0]], ["f=hidden", "숨김", counts[1]], ["f=photo", "사진 후기", counts[2]]]}
        />
        <SearchBox action="/admin/reviews" q={q} placeholder="내용·상품·작성자·채취자" hidden={{ f }} />
      </div>
      {!list.length ? (
        <EmptyState title="해당하는 후기가 없어요" />
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r.id} className={`card p-4 sm:p-5 ${r.hidden ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Stars value={r.rating} size={13} />
                  <b>{r.buyer.name}</b>
                  <span className="text-xs text-bark-400">{r.buyer.email} · {ymd(r.createdAt)}</span>
                  {r.hidden && <Badge tone="rose">숨김</Badge>}
                </div>
                {r.hidden ? (
                  <ActionButton url={`/api/admin/reviews/${r.id}`} body={{ hidden: false }} label="다시 노출" />
                ) : (
                  <ActionButton url={`/api/admin/reviews/${r.id}`} body={{ hidden: true }} label="숨기기" className="btn-sm rounded-full px-3 text-xs text-bark-400 hover:text-rose-600" confirm="이 후기를 숨길까요?" />
                )}
              </div>
              <p className="mt-1 text-xs text-bark-500">
                <Link href={`/products/${r.product.id}`} className="underline">{r.product.title}</Link> · 채취자 {r.seller.sellerProfile?.farmName || r.seller.name}
              </p>
              {parseTags(r.tags).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {parseTags(r.tags).map((t) => <span key={t} className="rounded-full bg-hanji-100 px-2 py-0.5 text-[11px] font-semibold text-bark-700">{t}</span>)}
                </div>
              )}
              {r.content && <p className="mt-2 whitespace-pre-line text-sm text-bark-700">{r.content}</p>}
              {parsePhotos(r.photos).length > 0 && (
                <div className="mt-2 flex gap-2">
                  {parsePhotos(r.photos).map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={src} href={src} target="_blank" rel="noreferrer"><img src={src} alt="" className="h-14 w-14 rounded-lg object-cover" /></a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
